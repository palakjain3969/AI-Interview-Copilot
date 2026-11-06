
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  Mic,
  MicOff,
  Volume2,
  Pause,
  Play,
  Square,
} from "lucide-react";

import { api, paths, extractList, getErrorMessage } from "../api";
import Loading from "../components/Loading";
import Notice from "../components/Notice";

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [questions, setQuestions] = useState(
    location.state?.questions || []
  );

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(
    !location.state?.questions?.length
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);

  // Speech-to-Text states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Text-to-Speech states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [autoReadNext, setAutoReadNext] = useState(false);

  const recognitionRef = useRef(null);
  const autoReadNextRef = useRef(false);

  // Load interview questions
  async function loadQuestions() {
    setBusy(true);
    setError("");

    const attempts = [
      async () => {
        const response = await api.get(`${paths.interviews}/${id}`);
        const data = response.data;

        return extractList(
          data?.questions ? data.questions : data
        );
      },

      async () =>
        extractList(
          (
            await api.get(paths.questions, {
              params: { interviewId: id },
            })
          ).data
        ),

      async () =>
        extractList(
          (
            await api.get(`${paths.interviews}/${id}/questions`)
          ).data
        ),
    ];

    let lastError;

    for (const attempt of attempts) {
      try {
        const list = await attempt();

        if (list.length) {
          setQuestions(
            list.sort(
              (a, b) => (a.order || 0) - (b.order || 0)
            )
          );

          setBusy(false);
          return;
        }
      } catch (err) {
        lastError = err;
      }
    }

    setError(
      lastError
        ? getErrorMessage(lastError)
        : "No questions were returned. Check your question retrieval API route."
    );

    setBusy(false);
  }

  useEffect(() => {
    if (!questions.length) {
      loadQuestions();
    }

    // Load only when interview ID changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Stop voice features when leaving the page
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const current = questions[index];

  // -----------------------------
  // TEXT-TO-SPEECH
  // -----------------------------

  function speakQuestion(question = current) {
    if (!question) return;

    if (!("speechSynthesis" in window)) {
      setTtsSupported(false);
      setError(
        "Text-to-Speech is not supported in this browser."
      );
      return;
    }

    const questionText =
      question.question ||
      question.text ||
      "";

    if (!questionText.trim()) return;

    // Stop any previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      questionText
    );

    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      setIsPaused(false);

      if (event.error !== "canceled" && event.error !== "interrupted") {
        setError("Unable to play the question. Please try again.");
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  function pauseSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }

  function resumeSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
    setIsPaused(false);
  }

  // Automatically read the next question after submission,
  // but only when the user has enabled this option.
  useEffect(() => {
    if (autoReadNextRef.current && questions[index]) {
      autoReadNextRef.current = false;
      speakQuestion(questions[index]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // -----------------------------
  // SPEECH-TO-TEXT
  // -----------------------------

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setError(
        "Speech recognition is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    // Stop question audio before recording
    stopSpeaking();

    setError("");

    try {
      const recognition = new SpeechRecognition();

      recognitionRef.current = recognition;

      recognition.lang = "en-IN";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";

        for (
          let i = event.resultIndex;
          i < event.results.length;
          i++
        ) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        if (finalTranscript.trim()) {
          setAnswer((previousAnswer) => {
            const separator = previousAnswer.trim() ? " " : "";

            return (
              previousAnswer +
              separator +
              finalTranscript.trim()
            );
          });
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);

        if (event.error === "not-allowed") {
          setError(
            "Microphone permission denied. Please allow microphone access."
          );
        } else if (event.error === "no-speech") {
          setError(
            "No speech detected. Please try speaking again."
          );
        } else {
          setError(
            `Voice recognition error: ${event.error}`
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      setError("Could not start microphone. Please try again.");
    }
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsListening(false);
  }

  // -----------------------------
  // INTERVIEW PROGRESS
  // -----------------------------

  const completedCount = index;

  const percent = questions.length
    ? Math.round(
        (completedCount / questions.length) * 100
      )
    : 0;

  // -----------------------------
  // SUBMIT ANSWER
  // -----------------------------

  async function submitAnswer() {
    if (!current) return;

    if (!answer.trim()) {
      setError("Please write or speak an answer before submitting.");
      return;
    }

    stopListening();
    stopSpeaking();

    const questionId =
      current._id ||
      current.id ||
      current.questionId;

    if (!questionId) {
      setError(
        "This question is missing its ID. Check the questions API response."
      );
      return;
    }

    setSending(true);
    setError("");
    setFeedback(null);

    try {
      const response = await api.post(paths.answers, {
        questionId,
        answer: answer.trim(),
      });

      const data = response.data;

      setFeedback(data);
      setAnswer("");

      if (index < questions.length - 1) {
        // Read next question only if auto-read is enabled
        autoReadNextRef.current = autoReadNext;

        setIndex(index + 1);
      } else {
        navigate(`/interviews/${id}/results`, {
          state: { justCompleted: true },
        });
      }
    } catch (err) {
      if (err?.response?.status === 409) {
        setError(
          "This question has already been answered. Move to the next question or open the results if the interview is complete."
        );
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setSending(false);
    }
  }

  if (busy) {
    return <Loading label="Preparing your interview..." />;
  }

  return (
    <div className="narrow-page interview-page">

      <button
        className="back-btn"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={16} />
        Dashboard
      </button>

      <div className="eyebrow">
        LIVE INTERVIEW SESSION
      </div>

      <div className="interview-heading">
        <div>
          <h1>
            Interview <span className="title-dot">.</span>
          </h1>

          <p className="muted">
            Take your time. Structure your thoughts and explain your reasoning.
          </p>
        </div>

        <div className="question-counter">
          {Math.min(index + 1, questions.length)}
          <span> / {questions.length}</span>
        </div>
      </div>

      <div className="progress-track">
        <div style={{ width: `${percent}%` }} />
      </div>

      <Notice>{error}</Notice>

      {current ? (
        <div className="question-card">

          <div className="question-top">
            <span className="tag">
              QUESTION {index + 1}
            </span>

            <span className="topic-tag">
              {current.topic || "General"} ·{" "}
              {current.difficulty || "Medium"}
            </span>
          </div>

          <h2>
            {current.question ||
              current.text ||
              "Question text unavailable"}
          </h2>

          {/* TEXT-TO-SPEECH CONTROLS */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "18px",
              marginBottom: "20px",
            }}
          >

            {!isSpeaking ? (
              <button
                type="button"
                className="btn secondary"
                onClick={() => speakQuestion()}
                disabled={!ttsSupported}
              >
                <Volume2 size={17} />
                Read question
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={resumeSpeaking}
                  >
                    <Play size={17} />
                    Resume
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={pauseSpeaking}
                  >
                    <Pause size={17} />
                    Pause
                  </button>
                )}

                <button
                  type="button"
                  className="btn secondary"
                  onClick={stopSpeaking}
                >
                  <Square size={15} />
                  Stop
                </button>
              </>
            )}

          </div>

          {/* AUTO READ OPTION */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              fontSize: "13px",
              marginBottom: "20px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={autoReadNext}
              onChange={(e) =>
                setAutoReadNext(e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                accentColor: "#8b5cf6",
              }}
            />

            Automatically read the next question
          </label>

          {/* ANSWER INPUT */}
          <label className="answer-label">
            Your answer

            <textarea
              rows="9"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write your answer here or use the microphone to speak..."
            />
          </label>

          {/* SPEECH-TO-TEXT CONTROLS */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginTop: "14px",
              marginBottom: "18px",
            }}
          >

            {isListening ? (
              <button
                type="button"
                className="btn secondary"
                onClick={stopListening}
              >
                <MicOff size={17} />
                Stop recording
              </button>
            ) : (
              <button
                type="button"
                className="btn secondary"
                onClick={startListening}
                disabled={!speechSupported || sending}
              >
                <Mic size={17} />
                Speak your answer
              </button>
            )}

            {isListening && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  color: "#ef4444",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: "9px",
                    height: "9px",
                    borderRadius: "50%",
                    background: "#ef4444",
                    display: "inline-block",
                  }}
                />
                Listening... Speak now
              </span>
            )}

          </div>

          {/* SUBMIT ANSWER */}
          <div className="answer-actions">
            <span className="muted small-text">
              Your answer is evaluated by AI when submitted.
            </span>

            <button
              className="btn primary"
              onClick={submitAnswer}
              disabled={sending || isListening}
            >
              {sending
                ? "Evaluating..."
                : index === questions.length - 1
                ? "Submit final answer"
                : "Submit answer"}

              <Send size={16} />
            </button>
          </div>

        </div>
      ) : (
        <div className="empty-state">
          <h3>No questions found</h3>

          <p className="muted">
            The interview may have been created, but the frontend could not retrieve its questions.
          </p>

          <button
            className="btn secondary"
            onClick={loadQuestions}
          >
            Try again
          </button>
        </div>
      )}

      {feedback && (
        <div className="feedback-inline">
          <CheckCircle2 size={18} />

          <span>
            Answer submitted.{" "}
            {feedback.evaluation?.score ??
              feedback.answer?.score ??
              ""}

            {feedback.evaluation?.score != null ||
            feedback.answer?.score != null
              ? "/10"
              : ""}
          </span>
        </div>
      )}

    </div>
  );
}
