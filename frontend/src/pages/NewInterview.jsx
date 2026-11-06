
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";

import { api, paths, getErrorMessage } from "../api";
import Notice from "../components/Notice";

// Available interview topics
const allTopics = [
  "Algorithms",
  "Arrays",
  "Artificial Intelligence",
  "Angular",
  "Blockchain",
  "C Programming",
  "C++",
  "Cloud Computing",
  "Computer Networks",
  "Cyber Security",
  "Data Structures",
  "Database Management Systems",
  "Deep Learning",
  "Dynamic Programming",
  "Express.js",
  "Git and GitHub",
  "HTML and CSS",
  "Java",
  "JavaScript",
  "Machine Learning",
  "MongoDB",
  "MySQL",
  "Node.js",
  "Object-Oriented Programming",
  "Operating Systems",
  "Python",
  "React.js",
  "SQL",
  "System Design",
  "TypeScript",
  "Web Development",
];

export default function NewInterview() {
  const navigate = useNavigate();

  // Interview details
  const [role, setRole] = useState("Software Engineer");
  const [experience, setExperience] = useState("Fresher");
  const [difficulty, setDifficulty] = useState("Medium");

  // Topic selection
  const [topics, setTopics] = useState([
    "JavaScript",
    "DSA",
    "Databases",
  ]);

  const [topicInput, setTopicInput] = useState("");
  const [showTopicSuggestions, setShowTopicSuggestions] =
    useState(false);

  // Question count
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);

  // Loading and error states
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Filter topics based on what the user types
  const filteredTopics = allTopics.filter(
    (topic) =>
      topic.toLowerCase().startsWith(topicInput.toLowerCase()) &&
      !topics.some(
        (selected) =>
          selected.toLowerCase() === topic.toLowerCase()
      )
  );

  // Add a topic
  function addTopic(topic) {
    const newTopic = topic.trim();

    if (!newTopic) return;

    const alreadyExists = topics.some(
      (item) => item.toLowerCase() === newTopic.toLowerCase()
    );

    if (!alreadyExists) {
      setTopics((currentTopics) => [
        ...currentTopics,
        newTopic,
      ]);
    }

    setTopicInput("");
    setShowTopicSuggestions(false);
  }

  // Handle topic input
  function handleTopicInput(e) {
    setTopicInput(e.target.value);
    setShowTopicSuggestions(true);
  }

  // Remove a selected topic
  function removeTopic(topicToRemove) {
    setTopics((currentTopics) =>
      currentTopics.filter(
        (topic) => topic !== topicToRemove
      )
    );
  }

  // Create interview
  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError("");

    try {
      const { data } = await api.post(paths.interviews, {
        role,
        experience,
        difficulty,
        topics,
        numberOfQuestions: Number(numberOfQuestions),
      });

      const interview =
        data?.interview ||
        data?.data?.interview ||
        data?.data ||
        data;

      const id =
        interview?._id ||
        interview?.id ||
        interview?.interviewId;

      if (!id) {
        throw new Error(
          "Interview was created but response did not include an interview ID. Check backend response."
        );
      }

      navigate(`/interviews/${id}`, {
        state: {
          questions:
            interview.questions || data.questions || [],
        },
      });

    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="narrow-page">

      {/* BACK BUTTON */}
      <button
        className="back-btn"
        type="button"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="eyebrow">
        NEW PRACTICE SESSION
      </div>

      <h1>
        Set up your{" "}
        <span className="gradient-text">interview.</span>
      </h1>

      <p className="muted">
        Choose your role and focus areas. Your AI interviewer
        will prepare a tailored set of questions.
      </p>

      <div className="form-card">

        {/* FORM HEADING */}
        <div className="form-card-title">

          <div className="stat-icon purple">
            <Sparkles size={19} />
          </div>

          <div>
            <strong>Interview configuration</strong>
            <span>Customize your practice session</span>
          </div>

        </div>

        <Notice>{error}</Notice>

        <form
          className="form-stack"
          onSubmit={submit}
        >

          {/* TARGET ROLE */}
          <label>
            Target role

            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer"
              required
            />
          </label>

          {/* EXPERIENCE AND DIFFICULTY */}
          <div className="two-col">

            <label>
              Experience level

              <select
                value={experience}
                onChange={(e) =>
                  setExperience(e.target.value)
                }
              >
                <option>Fresher</option>
                <option>0-1 years</option>
                <option>1-3 years</option>
                <option>3-5 years</option>
                <option>5+ years</option>
              </select>
            </label>

            <label>
              Difficulty

              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value)
                }
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </label>

          </div>

          {/* TOPIC AUTOCOMPLETE */}
          <div>

            <label>
              Interview Topics
            </label>

            <p className="field-hint">
              Start typing to search and select topics.
            </p>

            <div
              style={{
                position: "relative",
                marginTop: "10px",
              }}
              onBlur={(e) => {
                if (
                  !e.currentTarget.contains(e.relatedTarget)
                ) {
                  setShowTopicSuggestions(false);
                }
              }}
            >

              {/* TOPIC INPUT */}
              <input
                value={topicInput}
                onChange={handleTopicInput}
                onFocus={() =>
                  setShowTopicSuggestions(true)
                }
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowTopicSuggestions(false);
                  }

                  if (e.key === "Enter") {
                    e.preventDefault();

                    if (filteredTopics.length > 0) {
                      addTopic(filteredTopics[0]);
                    } else if (topicInput.trim()) {
                      addTopic(topicInput);
                    }
                  }
                }}
                placeholder="Type a topic, e.g. Operating Systems"
              />

              {/* AUTOCOMPLETE DROPDOWN */}
              {showTopicSuggestions &&
                topicInput.trim() && (

                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 20,
                      background: "var(--card, #20202a)",
                      border: "1px solid var(--border, #555)",
                      borderRadius: "10px",
                      marginTop: "5px",
                      maxHeight: "190px",
                      overflowY: "auto",
                      boxShadow:
                        "0 8px 20px rgba(0,0,0,0.2)",
                    }}
                  >

                    {filteredTopics.length > 0 ? (

                      filteredTopics.map((topic) => (

                        <button
                          key={topic}
                          type="button"
                          onMouseDown={(e) =>
                            e.preventDefault()
                          }
                          onClick={() => addTopic(topic)}
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            padding: "11px 14px",
                            background: "transparent",
                            border: "none",
                            color: "inherit",
                            cursor: "pointer",
                          }}
                        >
                          + {topic}
                        </button>

                      ))

                    ) : (

                      <button
                        type="button"
                        onMouseDown={(e) =>
                          e.preventDefault()
                        }
                        onClick={() => addTopic(topicInput)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "11px 14px",
                          background: "transparent",
                          border: "none",
                          color: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        + Add "{topicInput}" as custom topic
                      </button>

                    )}

                  </div>

                )}

            </div>

            {/* SELECTED TOPICS */}
            <div style={{ marginTop: "18px" }}>

              <strong style={{ fontSize: "14px" }}>
                Selected Topics ({topics.length})
              </strong>

              {topics.length === 0 ? (

                <p className="field-hint">
                  No topics selected. Start typing to add topics.
                </p>

              ) : (

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "9px",
                    marginTop: "12px",
                  }}
                >

                  {topics.map((topic) => (

                    <span
                      key={topic}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                        padding: "8px 12px",
                        borderRadius: "20px",
                        border: "1px solid #8b5cf6",
                        background:
                          "rgba(139,92,246,0.16)",
                        fontSize: "13px",
                      }}
                    >

                      {topic}

                      <button
                        type="button"
                        onClick={() => removeTopic(topic)}
                        aria-label={`Remove ${topic}`}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "inherit",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                        }}
                      >
                        <X size={13} />
                      </button>

                    </span>

                  ))}

                </div>

              )}

            </div>

          </div>

          {/* NUMBER OF QUESTIONS */}
          <label>
            Number of questions

            <input
              type="number"
              min="1"
              max="20"
              value={numberOfQuestions}
              onChange={(e) =>
                setNumberOfQuestions(e.target.value)
              }
              required
            />

            <span className="field-hint">
              Choose between 1 and 20 questions.
            </span>
          </label>

          {/* INFORMATION */}
          <div className="info-strip">

            <Sparkles size={17} />

            <span>
              AI will generate {numberOfQuestions || 0} questions
              based on your role, experience, difficulty and
              selected topics.
            </span>

          </div>

          {/* GENERATE INTERVIEW */}
          <button
            className="btn primary full"
            type="submit"
            disabled={
              busy ||
              !role.trim() ||
              !numberOfQuestions ||
              Number(numberOfQuestions) < 1 ||
              Number(numberOfQuestions) > 20
            }
          >

            {busy
              ? "Generating interview..."
              : "Generate interview"}

            <ArrowRight size={17} />

          </button>

        </form>

      </div>

    </div>
  );
}
