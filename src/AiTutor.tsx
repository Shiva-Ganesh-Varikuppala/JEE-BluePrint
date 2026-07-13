import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { BrainCircuit, ImagePlus, LoaderCircle, Send, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { request } from './Auth';

const normalizeAnswer = (text: string) => text
  .replace(/^([A-Za-z][A-Za-z\s()/+-]*):\*\*\s*/gm, '**$1:** ')
  .split('\n')
  .map((line) => {
    const delimiterCount = (line.match(/\$\$/g) || []).length;
    if (delimiterCount !== 1) return line;
    // Gemini occasionally omits one display-math delimiter. Repair a single-line
    // formula so it is still rendered instead of exposing raw LaTex to the student.
    return line.trimStart().startsWith('$$') ? `${line}$$` : `$$${line}`;
  })
  .join('\n')
  .trim();

function MarkdownAnswer({ text }: { text: string }) {
  return (
    <article className="answer-text">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {normalizeAnswer(text)}
      </ReactMarkdown>
    </article>
  );
}

export default function AiTutor() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] || null;
    if (next && next.size > 8 * 1024 * 1024) {
      setError('Use an image smaller than 8 MB.');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : '');
    setError('');
    setAnswer('');
  };

  const solve = async (event: FormEvent) => {
    event.preventDefault();
    if (!file && !question.trim()) {
      setError('Upload a question image or type the question.');
      return;
    }
    setLoading(true);
    setError('');
    setAnswer('');
    try {
      const form = new FormData();
      if (file) form.append('image', file);
      form.append('question', question);
      const result = await request('/ai/solve', { method: 'POST', body: form });
      setAnswer(result.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to solve the question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ai-tutor">
      <div className="ai-heading">
        <div>
          <p className="eyebrow">JEE BLUEPRINT AI</p>
          <h1>Ask the study assistant</h1>
          <p>Upload a clear question photo or write the question. The tutor will identify the topic, solve it step by step, and give an exam approach.</p>
        </div>
        <div className="ai-badge"><Sparkles /><span>JEE Main + Advanced<br /><b>guided solutions</b></span></div>
      </div>
      <div className="ai-layout">
        <form className="ai-form" onSubmit={solve}>
          <div className="ai-upload">
            {preview ? (
              <div className="image-preview">
                <img src={preview} alt="Question preview" />
                <button type="button" onClick={() => { setFile(null); setPreview(''); }}><X /></button>
              </div>
            ) : (
              <label className="upload-label">
                <ImagePlus />
                <b>Upload question image</b>
                <span>JPG, PNG or WEBP - up to 8 MB</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={choose} />
              </label>
            )}
          </div>
          <label className="ai-question">
            Extra context or typed question
            <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Optional: mention what you are stuck on, or type the full question here." />
          </label>
          {error && <p className="ai-error">{error}</p>}
          <button className="ask-ai" disabled={loading}>
            {loading ? <><LoaderCircle className="spin" /> Solving your question...</> : <><Send /> Solve with AI</>}
          </button>
          <p className="ai-privacy">Your Gemini API key stays on the server. Upload only questions you are allowed to share.</p>
        </form>
        <div className="ai-answer">
          <div className="answer-title">
            <BrainCircuit />
            <div>
              <p className="eyebrow">SOLUTION</p>
              <h2>{answer ? 'JEE-focused explanation' : 'Your answer will appear here'}</h2>
            </div>
          </div>
          {loading ? (
            <div className="answer-loading"><LoaderCircle className="spin" /><span>Reading the question and preparing a solution...</span></div>
          ) : answer ? (
            <MarkdownAnswer text={answer} />
          ) : (
            <div className="answer-empty"><Sparkles /><p>The AI tutor will provide the subject, chapter, step-by-step solution, final answer, and a short exam approach.</p></div>
          )}
        </div>
      </div>
    </section>
  );
}
