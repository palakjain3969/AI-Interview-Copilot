import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lightbulb, Target, Trophy } from "lucide-react";
import { api, paths, getErrorMessage } from "../api";
import Loading from "../components/Loading";
import Notice from "../components/Notice";

export default function Results() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get(`${paths.interviews}/${id}/result`)
      .then(({ data }) => setResult(data))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setBusy(false));
  }, [id]);
  if (busy) return <Loading label="Calculating your interview results..." />;
  const score = Number(result?.overallScore ?? 0);
  const rows = result?.results || [];
  return <div>
    <div className="welcome-row"><div><div className="eyebrow">SESSION SUMMARY</div><h1>Interview results<span className="title-dot">.</span></h1><p className="muted">Review your performance and identify what to improve next.</p></div><Link to="/" className="btn secondary"><ArrowLeft size={16}/> Dashboard</Link></div>
    <Notice>{error}</Notice>
    {result && <>
      <div className="result-hero">
        <div className="result-score"><div className="eyebrow">OVERALL SCORE</div><div className="score-big">{Number.isFinite(score) ? score.toFixed(1) : "—"}<span>/10</span></div><div className="result-status"><CheckCircle2 size={15}/> {result.status || "Completed"}</div></div>
        <div className="result-summary"><div className="stat-icon green"><Trophy size={20}/></div><h2>{score >= 8 ? "Excellent work!" : score >= 6 ? "Good progress!" : "Keep practicing!"}</h2><p className="muted">You answered {result.answeredQuestions ?? rows.length} out of {result.totalQuestions ?? rows.length} questions for the {result.role || "selected"} role.</p><div className="result-facts"><span><strong>{result.experience || "—"}</strong> Experience</span><span><strong>{result.difficulty || "—"}</strong> Difficulty</span></div></div>
      </div>
      <div className="section-heading"><div><h2>Question-by-question feedback</h2><p className="muted">Scores and AI-generated feedback for each response</p></div></div>
      <div className="results-list">{rows.map((item,i)=><article className="result-card" key={item.questionId || i}>
        <div className="result-card-head"><div><span className="tag">QUESTION {i+1}</span><span className="topic-tag">{item.topic || "General"}</span></div><div className="result-mark">{item.score ?? "—"}<small>/10</small></div></div>
        <h3>{item.question}</h3><div className="your-answer"><span className="eyebrow">YOUR ANSWER</span><p>{item.answer || "No answer text available."}</p></div>
        <div className="feedback-text"><Lightbulb size={17}/><p>{item.feedback || "No feedback available."}</p></div>
        <div className="feedback-columns">
          <div><h4><CheckCircle2 size={15}/> Strengths</h4>{item.strengths?.length ? <ul>{item.strengths.map((x,j)=><li key={j}>{x}</li>)}</ul> : <p className="muted small-text">No specific strengths listed.</p>}</div>
          <div><h4><Target size={15}/> Areas to improve</h4>{item.weaknesses?.length ? <ul>{item.weaknesses.map((x,j)=><li key={j}>{x}</li>)}</ul> : <p className="muted small-text">No weaknesses identified.</p>}</div>
        </div>
      </article>)}</div>
      <div className="bottom-cta"><div><strong>Ready for another round?</strong><span>Practice again to improve your score.</span></div><Link to="/interviews/new" className="btn primary">Start new interview</Link></div>
    </>}
  </div>;
}