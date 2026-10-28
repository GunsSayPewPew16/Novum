const KEY = "novum.subjects"

export function loadSubjects(storage = localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(KEY) || "[]")
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export function saveSubjects(subjects, storage = localStorage) {
  storage.setItem(KEY, JSON.stringify(subjects))
}

export function toggleTopic(subjects, selected, moduleIndex, topicIndex) {
  return subjects.map((subject) => subject.id !== selected ? subject : {
    ...subject,
    modules: subject.modules.map((module, i) => i !== moduleIndex ? module : {
      ...module,
      topics: module.topics.map((topic, j) => j !== topicIndex ? topic : { ...topic, done: !topic.done }),
    }),
  })
}
