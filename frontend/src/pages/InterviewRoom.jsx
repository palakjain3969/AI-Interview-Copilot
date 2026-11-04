import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Send } from "lucide-react";
import { api, paths, extractList, getErrorMessage } from "../api";
import Loading from "../components/Loading";
import Notice from "../components/Notice";

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(!location.state?.questions?.length);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);

  async function loadQuestions() {
    setBusy(true);
    setError("");
    const attempts = [
      async () => extractList((await api.get(`${paths.interviews}/${id}`)).data?.questions
        ? (await api.get(`${paths.interviews}/${id}`)).data.questions
        : (await api.get(`${paths.interviews}/${id}`)).data),
      async () => extractList((await api.get(paths.questions, { params: { interviewId: id } })).data),
      async () => extractList((await api.get(`${paths.interviews}/${id}/questions`)).data)
    ];
    let lastError;
    for (const attempt of attempts) {
      try {
        const list = await attempt();
        if (list.length) {
          setQuestions(list.sort((a, b) => (a.order || 0) - (b.order || 0)));
          setBusy(false);
          return;
        }
      } catch (err) { lastError = err; }
    }
    setError(lastError ? getErrorMessage(lastError) : "No questions were returned. Check your question retrieval API route.");
    setBusy(false);
  }

  useEffect(() => {
    if (!questions.length) loadQuestions();
    // Intentionally load only when the interview ID changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const current = questions[index];
  const completedCount = index;
  const percent = questions.length ? Math.round((completedCount / questions.length) * 100) : 0;

  async function submitAnswer() {
    if (!current) return;
    if (!answer.trim()) { setError("Please write an answer before submitting."); return; }
    const questionId = current._id || current.id || current.questionId;
    if (!questionId) { setError("This question is missing its ID. Check the questions API response."); return; }
    setSending(true); setError(""); setFeedback(null);
    try {
      const response = await api.post(paths.answers, { questionId, answer: answer.trim() });
      const data = response.data;
      setFeedback(data);
      setAnswer("");
      if (index < questions.length - 1) {
        setIndex(index + 1);
      } else {
        navigate(`/interviews/${id}/results`, { state: { justCompleted: true } });
      }
    } catch (err) {
      if (err?.response?.status === 409) {
        setError("This question has already been answered. Move to the next question or open the results if the interview is complete.");
      } else {
        setError(getErrorMessage(err));
      }
    } finally { setSending(false); }
  }

  if (busy) return <Loading label="Preparing your interview..." />;
  return <div className="narrow-page interview-page">
    <button className="back-btn" onClick={() => navigate("/")}><ArrowLeft size={16}/> Dashboard</button>
    <div className="eyebrow">LIVE INTERVIEW SESSION</div>
    <div className="interview-heading"><div><h1>Interview <span className="title-dot">.</span></h1><p className="muted">Take your time. Structure your thoughts and explain your reasoning.</p></div><div className="question-counter">{Math.min(index + 1, questions.length)} <span>/ {questions.length}</span></div></div>
    <div className="progress-track"><div style={{ width: `${percent}%` }}/></div>
    <Notice>{error}</Notice>
    {current ? <div className="question-card">
      <div className="question-top"><span className="tag">QUESTION {index + 1}</span><span className="topic-tag">{current.topic || "General"} · {current.difficulty || "Medium"}</span></div>
      <h2>{current.question || current.text || "Question text unavailable"}</h2>
      <label className="answer-label">Your answer<textarea rows="9" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Write your answer here. Explain your approach, reasoning, and examples..." /></label>
      <div className="answer-actions"><span className="muted small-text">Your answer is evaluated by AI when submitted.</span><button className="btn primary" onClick={submitAnswer} disabled={sending}>{sending ? "Evaluating..." : index === questions.length - 1 ? "Submit final answer" : "Submit answer"} <Send size={16}/></button></div>
    </div> : <div className="empty-state"><h3>No questions found</h3><p className="muted">The interview may have been created, but the frontend could not retrieve its questions.</p><button className="btn secondary" onClick={loadQuestions}>Try again</button></div>}
    {feedback && <div className="feedback-inline"><CheckCircle2 size={18}/><span>Answer submitted. {feedback.evaluation?.score ?? feedback.answer?.score ?? ""} {feedback.evaluation?.score != null || feedback.answer?.score != null ? "/10" : ""}</span></div>}
  </div>;
}