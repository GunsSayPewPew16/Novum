import { useState } from "react"
import { ArrowLeft, BookOpen, Check, CaretRight, FileText, Plus } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { analyzeSyllabus, MAX_PDF_BYTES } from "@/lib/syllabus"
import { loadSubjects, saveSubjects, toggleTopic } from "@/lib/subjects"
const panel = "rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,.12)]"
const focus = "outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"

function Back({ onClick, children }) {
  return <button type="button" onClick={onClick} className={cn("flex min-h-11 items-center gap-2 text-sm text-white/75 hover:text-white", focus)}><ArrowLeft size={18} aria-hidden="true" />{children}</button>
}

function SubjectList({ subjects, onAdd, onOpen }) {
  return <div className="flex flex-col gap-5 pt-5">
    <div className="flex items-end justify-between gap-4 px-1">
      <div><h1 className="font-serif text-[34px] font-medium italic leading-none">Your subjects</h1><p className="mt-2 text-sm text-white/70">A little progress, every day.</p></div>
      <Button onClick={onAdd} className="h-11 shrink-0 gap-2 px-4 text-[13px]"><Plus size={16} aria-hidden="true" /> Add subject</Button>
    </div>
    {subjects.length === 0 ? <div className={cn(panel, "flex min-h-64 flex-col items-center justify-center px-7 py-10 text-center")}>
      <span className="grid size-14 place-items-center rounded-full bg-orange-400/15 text-orange-200"><BookOpen size={25} aria-hidden="true" /></span>
      <h2 className="mt-5 font-serif text-2xl font-medium italic">Start with a subject</h2>
      <p className="mt-2 max-w-64 text-sm leading-5 text-white/70">Add a syllabus to turn its modules into a study checklist.</p>
      <Button onClick={onAdd} variant="glass" className="mt-5 h-11 gap-2 text-[13px]"><Plus size={16} aria-hidden="true" /> Add your first subject</Button>
    </div> : <div className="flex flex-col gap-2">{subjects.map((subject) => {
      const topics = subject.modules.flatMap((module) => module.topics)
      const done = topics.filter((topic) => topic.done).length
      return <button key={subject.id} type="button" onClick={() => onOpen(subject.id)} className={cn(panel, focus, "flex min-h-24 items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-white/10")}>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange-400/15 text-orange-200"><BookOpen size={22} aria-hidden="true" /></span>
        <span className="min-w-0 flex-1"><span className="block break-words text-base font-medium">{subject.name}</span><span className="mt-1 block text-xs text-white/70">{subject.modules.length} {subject.modules.length === 1 ? "module" : "modules"} · {done} of {topics.length} topics complete</span></span>
        <CaretRight size={18} className="shrink-0 text-white/60" aria-hidden="true" />
      </button>
    })}</div>}
  </div>
}

function AddSubject({ onBack, onSave }) {
  const [name, setName] = useState("")
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const submit = async (event) => {
    event.preventDefault()
    setError("")
    if (!name.trim() || !file) { setError("Enter a subject name and choose a syllabus PDF."); return }
    if (!file.name.toLowerCase().endsWith(".pdf") || file.size === 0 || file.size > MAX_PDF_BYTES) { setError("Choose a non-empty PDF no larger than 3 MB."); return }
    setBusy(true)
    try {
      const modules = await analyzeSyllabus(file)
      onSave({ id: crypto.randomUUID(), name: name.trim(), modules })
    } catch (err) {
      setError(err.message || "Could not create the checklist. Please try again.")
    } finally { setBusy(false) }
  }
  return <div className="flex flex-col gap-3 pt-2">
    <Back onClick={onBack}>Subjects</Back>
    <div className="px-1 pb-2"><h1 className="font-serif text-[34px] font-medium italic leading-tight">Add a subject</h1><p className="mt-2 text-sm leading-5 text-white/70">Turn your syllabus into a plan, one topic at a time.</p></div>
    <form onSubmit={submit} className={cn(panel, "flex flex-col gap-5 p-5")}>
      <label className="flex flex-col gap-2 text-sm font-medium">Subject name
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required placeholder="e.g. Organic chemistry" className={cn(focus, "h-12 rounded-xl border border-white/15 bg-black/20 px-4 text-base text-white placeholder:text-white/40")} />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">Syllabus PDF
        <span className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/25 bg-black/10 px-4 py-4 text-center text-white/75"><FileText size={23} className="text-orange-200" aria-hidden="true" /><span className="max-w-full break-all text-sm">{file ? file.name : "Choose a PDF"}</span><span className="text-xs text-white/60">Maximum 3 MB</span></span>
        <input type="file" accept="application/pdf,.pdf" required onChange={(e) => setFile(e.target.files?.[0] || null)} className={cn(focus, "block w-full text-xs text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white")} />
      </label>
      <p className="text-xs leading-5 text-white/70">Your PDF is sent to Google Gemini for analysis. Google may use free-tier content to improve its products. The checklist is saved in this browser; the PDF is not stored.</p>
      {error && <p role="alert" className="rounded-xl bg-red-400/10 px-3 py-2 text-sm text-red-100">{error}</p>}
      <Button type="submit" disabled={busy} className="h-12 w-full">{busy ? "Reading your syllabus…" : "Create checklist"}</Button>
      {busy && <p role="status" className="text-center text-xs text-white/70">This may take a moment. Keep this screen open.</p>}
    </form>
  </div>
}

function SubjectDetail({ subject, onBack, onToggle }) {
  const topics = subject.modules.flatMap((module) => module.topics)
  const done = topics.filter((topic) => topic.done).length
  return <div className="flex flex-col gap-3 pt-2">
    <Back onClick={onBack}>Subjects</Back>
    <div className="px-1 pb-2"><h1 className="break-words font-serif text-[34px] font-medium italic leading-tight">{subject.name}</h1><p className="mt-2 text-sm text-white/70">{done} of {topics.length} topics complete</p><p className="mt-1 text-xs text-white/60">Review the generated topics against your syllabus.</p></div>
    {subject.modules.map((module, moduleIndex) => <section key={moduleIndex} className={cn(panel, "overflow-hidden")}>
      <div className="border-b border-white/10 px-5 py-4"><h2 className="break-words text-base font-medium">{module.title}</h2><p className="mt-1 text-xs text-white/60">{module.topics.filter((topic) => topic.done).length} of {module.topics.length} complete</p></div>
      <ul className="divide-y divide-white/5">{module.topics.map((topic, topicIndex) => <li key={topicIndex}>
        <label className="flex min-h-14 cursor-pointer items-start gap-3 px-5 py-4 text-sm leading-5">
          <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center"><input type="checkbox" checked={topic.done} onChange={() => onToggle(moduleIndex, topicIndex)} className="peer absolute inset-0 size-5 cursor-pointer appearance-none rounded-md border border-white/40 checked:border-orange-300 checked:bg-orange-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300" /><Check size={14} weight="bold" className="pointer-events-none relative text-ink opacity-0 peer-checked:opacity-100" aria-hidden="true" /></span>
          <span className={cn("break-words", topic.done && "text-white/60 line-through")}>{topic.text}</span>
        </label>
      </li>)}</ul>
    </section>)}
  </div>
}

export default function SubjectsScreen() {
  const [subjects, setSubjects] = useState(loadSubjects)
  const [view, setView] = useState("list")
  const [selected, setSelected] = useState(null)
  const [storageError, setStorageError] = useState("")
  const save = (next) => {
    try { saveSubjects(next); setSubjects(next); setStorageError(""); return true }
    catch { setStorageError("Could not save to this browser. Check your storage settings or available space."); return false }
  }
  const add = (subject) => { if (save([...subjects, subject])) { setSelected(subject.id); setView("detail") } }
  const toggle = (moduleIndex, topicIndex) => {
    save(toggleTopic(subjects, selected, moduleIndex, topicIndex))
  }
  const subject = subjects.find((item) => item.id === selected)
  return <>
    {storageError && <p role="alert" className="rounded-xl bg-red-400/10 p-3 text-sm text-red-100">{storageError}</p>}
    {view === "add" ? <AddSubject onBack={() => setView("list")} onSave={add} /> : view === "detail" && subject ? <SubjectDetail subject={subject} onBack={() => setView("list")} onToggle={toggle} /> : <SubjectList subjects={subjects} onAdd={() => setView("add")} onOpen={(id) => { setSelected(id); setView("detail") }} />}
  </>
}
