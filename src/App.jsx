import React, { useEffect, useMemo, useState } from 'react';

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function parseDateKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function addWorkdays(startDate, duration) {
  const copy = new Date(startDate);
  let remaining = duration - 1;
  while (remaining > 0) {
    copy.setDate(copy.getDate() + 1);
    if (!isWeekend(copy)) remaining -= 1;
  }
  return copy;
}

function overlaps(task, date) {
  if (!task.startDate) return false;
  const start = parseDateKey(task.startDate);
  const end = addWorkdays(start, task.duration);
  return date >= start && date <= end && !isWeekend(date);
}

function getCalendarDays(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startOffset = (first.getDay() + 6) % 7;
  const endOffset = 6 - ((last.getDay() + 6) % 7);
  const start = addDays(first, -startOffset);
  const end = addDays(last, endOffset);
  const days = [];
  let current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }
  return days;
}

function sameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function colorStyles(color) {
  const map = {
    blauw: { background: '#2563eb', color: '#ffffff', borderColor: '#2563eb' },
    groen: { background: '#16a34a', color: '#ffffff', borderColor: '#16a34a' },
    oranje: { background: '#ea580c', color: '#ffffff', borderColor: '#ea580c' },
    rood: { background: '#dc2626', color: '#ffffff', borderColor: '#dc2626' },
    paars: { background: '#7c3aed', color: '#ffffff', borderColor: '#7c3aed' },
    grijs: { background: '#334155', color: '#ffffff', borderColor: '#334155' }
  };
  return map[color] || map.grijs;
}

const defaultTasks = [
  {
    id: crypto.randomUUID(),
    title: 'Lijnsysteem dak A',
    address: 'Stationsweg 14',
    city: 'Rotterdam',
    assignee: 'Mike',
    duration: 2,
    color: 'blauw',
    startDate: null
  },
  {
    id: crypto.randomUUID(),
    title: 'Inspectie ankerpunten',
    address: 'Langeweg 22',
    city: 'Dordrecht',
    assignee: 'Ruben',
    duration: 1,
    color: 'groen',
    startDate: null
  },
  {
    id: crypto.randomUUID(),
    title: 'Montage hekwerk',
    address: 'Industrieweg 8',
    city: 'Barendrecht',
    assignee: 'Dennis',
    duration: 3,
    color: 'oranje',
    startDate: null
  }
];

const names = ['Mike', 'Ruben', 'Dennis', 'Ploeg 1', 'Ploeg 2'];
const colors = ['blauw', 'groen', 'oranje', 'rood', 'paars', 'grijs'];

export default function App() {
  const today = new Date();
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('planning-board-tasks');
      return saved ? JSON.parse(saved) : defaultTasks;
    } catch {
      return defaultTasks;
    }
  });
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterName, setFilterName] = useState('alle');
  const [filterColor, setFilterColor] = useState('alle');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    address: '',
    city: '',
    assignee: 'Mike',
    duration: '1',
    color: 'blauw'
  });

  useEffect(() => {
    localStorage.setItem('planning-board-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const peopleOptions = useMemo(() => ['alle', ...new Set(tasks.map((task) => task.assignee))], [tasks]);
  const days = useMemo(() => getCalendarDays(monthDate), [monthDate]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const haystack = `${task.title} ${task.address} ${task.city} ${task.assignee}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesName = filterName === 'alle' || task.assignee === filterName;
      const matchesColor = filterColor === 'alle' || task.color === filterColor;
      return matchesSearch && matchesName && matchesColor;
    });
  }, [tasks, search, filterName, filterColor]);

  const unplannedTasks = filteredTasks.filter((task) => !task.startDate);

  function resetForm() {
    setEditingId(null);
    setForm({
      title: '',
      address: '',
      city: '',
      assignee: 'Mike',
      duration: '1',
      color: 'blauw'
    });
  }

  function submitForm(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.address.trim()) return;

    if (editingId) {
      setTasks((current) => current.map((task) => task.id === editingId ? {
        ...task,
        title: form.title.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        assignee: form.assignee,
        duration: Number(form.duration),
        color: form.color,
      } : task));
    } else {
      setTasks((current) => [...current, {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        assignee: form.assignee,
        duration: Number(form.duration),
        color: form.color,
        startDate: null
      }]);
    }

    resetForm();
  }

  function editTask(task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      address: task.address,
      city: task.city,
      assignee: task.assignee,
      duration: String(task.duration),
      color: task.color
    });
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id));
    if (editingId === id) resetForm();
  }

  function unscheduleTask(id) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, startDate: null } : task));
  }

  function onDropDate(dateKey) {
    if (!draggedTaskId) return;
    const targetDate = parseDateKey(dateKey);
    if (isWeekend(targetDate)) return;
    setTasks((current) => current.map((task) => task.id === draggedTaskId ? { ...task, startDate: dateKey } : task));
    setDraggedTaskId(null);
  }

  const monthTitle = monthDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.hero}>
            <div style={styles.heroIcon}>📅</div>
            <div>
              <h1 style={styles.h1}>Intern planningsbord</h1>
              <p style={styles.muted}>Vercel-klare versie met opslaan in de browser, filters en kaartjes slepen.</p>
            </div>
          </div>

          <form onSubmit={submitForm} style={styles.panel}>
            <h2 style={styles.h2}>{editingId ? 'Kaart bewerken' : 'Nieuwe kaart'}</h2>
            <input style={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Project / klusnaam" />
            <input style={styles.input} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Adres" />
            <input style={styles.input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Plaats" />
            <div style={styles.grid3}>
              <select style={styles.input} value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
                {names.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              <select style={styles.input} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}>
                <option value="1">1 dag</option>
                <option value="2">2 dagen</option>
                <option value="3">3 dagen</option>
                <option value="4">4 dagen</option>
                <option value="5">5 dagen</option>
              </select>
              <select style={styles.input} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
                {colors.map((color) => <option key={color} value={color}>{color}</option>)}
              </select>
            </div>
            <div style={styles.buttonRow}>
              <button style={styles.primaryButton} type="submit">{editingId ? 'Opslaan' : 'Kaart toevoegen'}</button>
              {(editingId || form.title || form.address || form.city) && <button style={styles.secondaryButton} type="button" onClick={resetForm}>Annuleren</button>}
            </div>
          </form>

          <div style={styles.panel}>
            <h2 style={styles.h2}>Zoeken en filteren</h2>
            <input style={styles.input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoek op project, adres, plaats of naam" />
            <div style={styles.grid2}>
              <select style={styles.input} value={filterName} onChange={(e) => setFilterName(e.target.value)}>
                {peopleOptions.map((name) => <option key={name} value={name}>{name === 'alle' ? 'Alle namen' : name}</option>)}
              </select>
              <select style={styles.input} value={filterColor} onChange={(e) => setFilterColor(e.target.value)}>
                <option value="alle">Alle kleuren</option>
                {colors.map((color) => <option key={color} value={color}>{color}</option>)}
              </select>
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.listHeader}>
              <h2 style={styles.h2}>Nog niet ingepland</h2>
              <span style={styles.counter}>{unplannedTasks.length}</span>
            </div>
            <div style={styles.taskList}>
              {unplannedTasks.length === 0 && <div style={styles.empty}>Geen kaartjes gevonden.</div>}
              {unplannedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={() => setDraggedTaskId(task.id)}
                  onEdit={() => editTask(task)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
            </div>
          </div>
        </aside>

        <main style={styles.main}>
          <div style={styles.calendarHeader}>
            <div>
              <h2 style={{ ...styles.h1, marginBottom: 6, textTransform: 'capitalize' }}>{monthTitle}</h2>
              <p style={styles.muted}>Sleep een kaartje naar een werkdag. Weekenden zijn zichtbaar maar tellen niet mee.</p>
            </div>
            <div style={styles.buttonRow}>
              <button style={styles.secondaryButton} onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}>Vorige</button>
              <button style={styles.secondaryButton} onClick={() => setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1))}>Vandaag</button>
              <button style={styles.secondaryButton} onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}>Volgende</button>
            </div>
          </div>

          <div style={styles.weekdays}>
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((label) => <div key={label} style={styles.weekday}>{label}</div>)}
          </div>

          <div style={styles.calendarGrid}>
            {days.map((date) => {
              const key = formatDateKey(date);
              const starts = filteredTasks.filter((task) => task.startDate === key);
              const continues = filteredTasks.filter((task) => overlaps(task, date) && task.startDate !== key);
              const muted = !sameMonth(date, monthDate);
              const weekend = isWeekend(date);
              return (
                <div
                  key={key}
                  style={{
                    ...styles.dayCell,
                    background: muted ? '#f8fafc' : '#ffffff',
                    borderColor: weekend ? '#fecaca' : '#dbe2ea'
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDropDate(key)}
                >
                  <div style={styles.dayTop}>
                    <span style={{ ...styles.dayNumber, color: weekend ? '#b91c1c' : '#0f172a' }}>{date.getDate()}</span>
                    {weekend && <span style={styles.weekendLabel}>weekend</span>}
                  </div>

                  <div style={styles.dayTasks}>
                    {starts.map((task) => (
                      <div key={task.id} style={{ ...styles.scheduledCard, ...colorStyles(task.color) }}>
                        <div style={styles.scheduledTitle}>{task.title}</div>
                        <div style={styles.smallLine}>{task.assignee}</div>
                        <div style={styles.smallLine}>{task.address}</div>
                        <div style={styles.smallLine}>{task.duration} dag{task.duration > 1 ? 'en' : ''}</div>
                        <div style={styles.cardActionsInline}>
                          <button style={styles.inlineActionLight} onClick={() => editTask(task)}>Bewerk</button>
                          <button style={styles.inlineActionLight} onClick={() => unscheduleTask(task.id)}>Haal eruit</button>
                        </div>
                      </div>
                    ))}
                    {continues.map((task) => (
                      <div key={task.id} style={{ ...styles.continueCard, borderColor: colorStyles(task.color).borderColor }}>
                        Vervolg · {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

function TaskCard({ task, onDragStart, onEdit, onDelete }) {
  return (
    <div draggable onDragStart={onDragStart} style={{ ...styles.taskCard, borderLeft: `8px solid ${colorStyles(task.color).background}` }}>
      <div style={styles.taskTitle}>{task.title}</div>
      <div style={styles.taskMeta}>{task.address}</div>
      <div style={styles.taskMeta}>{task.city || 'Geen plaats ingevuld'} · {task.assignee}</div>
      <div style={styles.taskMeta}>{task.duration} dag{task.duration > 1 ? 'en' : ''}</div>
      <div style={styles.cardActions}>
        <button style={styles.inlineAction} onClick={onEdit}>Bewerk</button>
        <button style={styles.inlineActionDanger} onClick={onDelete}>Verwijder</button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: 24,
    background: '#f3f4f6'
  },
  layout: {
    maxWidth: 1500,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '390px 1fr',
    gap: 24,
    alignItems: 'start'
  },
  sidebar: {
    display: 'grid',
    gap: 18,
    position: 'sticky',
    top: 24
  },
  hero: {
    background: '#ffffff',
    border: '1px solid #dbe2ea',
    borderRadius: 24,
    padding: 20,
    display: 'flex',
    gap: 14,
    alignItems: 'center'
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    background: '#0f172a',
    color: '#ffffff',
    display: 'grid',
    placeItems: 'center',
    fontSize: 24
  },
  h1: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.1
  },
  h2: {
    margin: 0,
    fontSize: 16
  },
  muted: {
    margin: '6px 0 0',
    color: '#64748b',
    fontSize: 14,
    lineHeight: 1.45
  },
  panel: {
    background: '#ffffff',
    border: '1px solid #dbe2ea',
    borderRadius: 24,
    padding: 18,
    display: 'grid',
    gap: 12
  },
  input: {
    width: '100%',
    borderRadius: 14,
    border: '1px solid #cbd5e1',
    padding: '12px 14px',
    background: '#ffffff'
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 10
  },
  buttonRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap'
  },
  primaryButton: {
    border: 'none',
    borderRadius: 14,
    background: '#0f172a',
    color: '#ffffff',
    padding: '12px 16px',
    cursor: 'pointer'
  },
  secondaryButton: {
    border: '1px solid #cbd5e1',
    borderRadius: 14,
    background: '#ffffff',
    color: '#0f172a',
    padding: '12px 16px',
    cursor: 'pointer'
  },
  listHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  counter: {
    minWidth: 28,
    height: 28,
    borderRadius: 999,
    background: '#e2e8f0',
    display: 'grid',
    placeItems: 'center',
    fontSize: 13,
    fontWeight: 700
  },
  taskList: {
    display: 'grid',
    gap: 10,
    maxHeight: 420,
    overflow: 'auto'
  },
  empty: {
    border: '1px dashed #cbd5e1',
    borderRadius: 16,
    padding: 16,
    color: '#64748b',
    background: '#f8fafc'
  },
  taskCard: {
    background: '#ffffff',
    border: '1px solid #dbe2ea',
    borderRadius: 18,
    padding: 14,
    cursor: 'grab',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)'
  },
  taskTitle: {
    fontWeight: 700,
    marginBottom: 6
  },
  taskMeta: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4
  },
  cardActions: {
    display: 'flex',
    gap: 8,
    marginTop: 10
  },
  cardActionsInline: {
    display: 'flex',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap'
  },
  inlineAction: {
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    borderRadius: 10,
    padding: '6px 10px',
    cursor: 'pointer'
  },
  inlineActionDanger: {
    border: '1px solid #fecaca',
    background: '#ffffff',
    color: '#b91c1c',
    borderRadius: 10,
    padding: '6px 10px',
    cursor: 'pointer'
  },
  inlineActionLight: {
    border: '1px solid rgba(255,255,255,0.45)',
    background: 'rgba(255,255,255,0.14)',
    color: '#ffffff',
    borderRadius: 10,
    padding: '6px 10px',
    cursor: 'pointer'
  },
  main: {
    background: '#ffffff',
    border: '1px solid #dbe2ea',
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden'
  },
  calendarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
    flexWrap: 'wrap'
  },
  weekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 10,
    marginBottom: 10
  },
  weekday: {
    padding: '8px 6px',
    color: '#64748b',
    fontWeight: 600,
    fontSize: 14
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 10
  },
  dayCell: {
    minHeight: 150,
    border: '1px solid #dbe2ea',
    borderRadius: 18,
    padding: 10
  },
  dayTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  dayNumber: {
    fontWeight: 700,
    fontSize: 14
  },
  weekendLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: '#b91c1c',
    letterSpacing: 0.6
  },
  dayTasks: {
    display: 'grid',
    gap: 8
  },
  scheduledCard: {
    borderRadius: 14,
    border: '1px solid transparent',
    padding: 10,
    fontSize: 12,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)'
  },
  scheduledTitle: {
    fontWeight: 700,
    marginBottom: 4
  },
  smallLine: {
    opacity: 0.95,
    marginBottom: 2
  },
  continueCard: {
    borderRadius: 14,
    border: '1px dashed #cbd5e1',
    padding: 8,
    fontSize: 11,
    background: '#f8fafc',
    color: '#475569'
  }
};
