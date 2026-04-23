import React, { useMemo, useState } from 'react';

const TEAM = [
  { id: 'piet', name: 'Piet', defaultFreeDays: [] },
  { id: 'jan', name: 'Jan', defaultFreeDays: [] },
  { id: 'willem', name: 'Willem', defaultFreeDays: [] },
  { id: 'gijs', name: 'Gijs', defaultFreeDays: [2] },
  { id: 'mike', name: 'Mike', defaultFreeDays: [] },
];

const COMPANY_HOLIDAYS = [
  { date: '2026-06-19', label: 'Bedrijfsvrij' },
];

const PERSONAL_HOLIDAYS = [
  { personId: 'gijs', date: '2026-06-17', label: 'Vrij' },
  { personId: 'willem', date: '2026-06-18', label: 'Vakantie' },
];

const INITIAL_PROJECTS = [
  {
    id: 'p1',
    name: 'DAKCHECK ZWART',
    address: 'Stationsweg 14, 3071 AA Rotterdam',
    city: 'Rotterdam',
    category: 'valbeveiliging',
    workType: 'Jaarlijkse inspectie en keuring',
    expectedDate: '2026-06-16',
    days: 1,
    slotType: 'half',
    peopleNeeded: 2,
    notes: 'Klant wil foto’s van de ankerpunten in rapport.',
    images: [],
    scheduledDays: [],
  },
  {
    id: 'p2',
    name: 'PROJECT GOOIJKADE',
    address: 'Gooijkade 88, 1013 AB Amsterdam',
    city: 'Amsterdam',
    category: 'waterdichting',
    workType: 'Bitumen herstel westzijde',
    expectedDate: '2026-06-17',
    days: 2,
    slotType: 'full',
    peopleNeeded: 2,
    notes: 'Materiaal via magazijn. Kraan niet nodig.',
    images: [],
    scheduledDays: ['2026-06-17', '2026-06-18'],
  },
  {
    id: 'p3',
    name: 'DAKRAND MAASSLUIS',
    address: 'Industrieweg 8, 3144 CH Maassluis',
    city: 'Maassluis',
    category: 'valbeveiliging',
    workType: 'Randbeveiliging en ankerpunten',
    expectedDate: '2026-06-17',
    days: 1,
    slotType: 'full',
    peopleNeeded: 1,
    notes: 'Kleine klus, voorzijde bereikbaar met bus.',
    images: [],
    scheduledDays: ['2026-06-17'],
  },
  {
    id: 'p4',
    name: 'HERSTEL LICHTSTRAAT',
    address: 'Parallelweg 2, 7411 JS Deventer',
    city: 'Deventer',
    category: 'waterdichting',
    workType: 'Naden afwerken en loodslab herstel',
    expectedDate: '2026-06-25',
    days: 1,
    slotType: 'half',
    peopleNeeded: 1,
    notes: 'Nog niet ingepland, vermoedelijk voor eind juni.',
    images: [],
    scheduledDays: [],
  },
];

const INITIAL_ASSIGNMENTS = {
  '2026-06-17::p2': ['piet', 'jan'],
  '2026-06-17::p3': ['willem'],
  '2026-06-18::p2': [],
};

const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr'];

function getMonday(d) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}
function prettyDay(date) {
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}
function weekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
function slotLoad(slotType) {
  return slotType === 'full' ? 1 : 0.5;
}
function slotLabel(slotType) {
  return slotType === 'full' ? 'Hele dag' : 'Halve dag';
}
function dateIsCompanyHoliday(dateKey) {
  return COMPANY_HOLIDAYS.some((h) => h.date === dateKey);
}
function personIsUnavailable(person, date) {
  const weekdayIndex = (date.getDay() + 6) % 7;
  const dateKey = formatDateKey(date);
  const defaultFree = person.defaultFreeDays.includes(weekdayIndex);
  const manualFree = PERSONAL_HOLIDAYS.some((h) => h.personId === person.id && h.date === dateKey);
  return defaultFree || manualFree || dateIsCompanyHoliday(dateKey);
}
function byId(arr, id) {
  return arr.find((item) => item.id === id);
}

function Header({ weekStart, onPrev, onNext, rolePreview, setRolePreview }) {
  return (
    <div className="panel hero">
      <div>
        <div className="hero-title">Uitvoeringsplanner V2</div>
        <div className="hero-subtitle">Weekplanning, open projecten, capaciteit en rechten in één overzicht.</div>
      </div>
      <div className="hero-actions">
        <span className="pill dark">Week {weekNumber(weekStart)}</span>
        <span className="pill">{prettyDay(weekStart)} t/m {prettyDay(addDays(weekStart, 4))}</span>
        <button className="btn btn-light" onClick={onPrev}>Vorige week</button>
        <button className="btn btn-light" onClick={onNext}>Volgende week</button>
        <select className="select" value={rolePreview} onChange={(e) => setRolePreview(e.target.value)}>
          <option value="beheerder">Beheerder</option>
          <option value="planner">Planner</option>
          <option value="kijker">Kijker</option>
        </select>
      </div>
    </div>
  );
}

function Tabs({ tab, setTab }) {
  return (
    <div className="tabs panel">
      <button className={tab === 'week' ? 'tab active' : 'tab'} onClick={() => setTab('week')}>Weekplanning</button>
      <button className={tab === 'open' ? 'tab active' : 'tab'} onClick={() => setTab('open')}>Nog in te plannen</button>
      <button className={tab === 'settings' ? 'tab active' : 'tab'} onClick={() => setTab('settings')}>Instellingen</button>
    </div>
  );
}

function ProjectCard({ project, dateKey, team, assignedIds, onAssign, onRemove, onEdit, readOnly }) {
  const assignedPeople = assignedIds.map((id) => byId(team, id)).filter(Boolean);
  const [showImage, setShowImage] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className={`project-card ${project.category === 'waterdichting' ? 'water' : 'fall'}`}>
      <div className="project-head">
        <div>
          <div className="project-name">{project.name}</div>
          <div className="project-address">{project.address}</div>
        </div>
        <div className="project-meta-right">
          <div>{project.expectedDate.split('-').reverse().join('-')}</div>
          <div>{slotLabel(project.slotType)}</div>
        </div>
      </div>
      <div className="project-tags">
        <span className={`tag ${project.category === 'waterdichting' ? 'blue' : 'green'}`}>{project.category}</span>
        <span className="tag light">{project.workType}</span>
      </div>
      <div className="crew-box">
        <div className="crew-title">Uitvoerders</div>
        <div className="crew-list">
          {assignedPeople.length === 0 && <span className="muted">Nog geen monteurs toegewezen</span>}
          {assignedPeople.map((person) => (
            <button key={person.id} className="crew-chip" onClick={() => onRemove(project.id, dateKey, person.id)} disabled={readOnly}>
              {person.name} ×
            </button>
          ))}
        </div>
      </div>
      <div className="project-notes">{project.notes || 'Geen notities'}</div>
      <div className="project-footer">
        <div className="mini-meta">Benodigd: {project.peopleNeeded} man · {project.days} dag(en)</div>
        <div className="actions-row">
          <button className="btn btn-light small" onClick={() => setShowImage(true)}>Afbeeldingen ({project.images.length})</button>
          {!readOnly && <button className="btn btn-light small" onClick={() => onEdit(project)}>Wijzigen</button>}
          {!readOnly && <button className="btn btn-light small" onClick={() => setPickerOpen((v) => !v)}>Monteur toevoegen</button>}
        </div>
      </div>
      {pickerOpen && !readOnly && (
        <div className="assign-picker">
          {team.map((person) => (
            <button
              key={person.id}
              className="btn btn-light small"
              onClick={() => onAssign(project.id, dateKey, person.id)}
            >
              {person.name}
            </button>
          ))}
        </div>
      )}
      {showImage && (
        <div className="modal-backdrop" onClick={() => setShowImage(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Afbeeldingen · {project.name}</div>
            <div className="image-grid">
              {(project.images.length ? project.images : ['voorbeeld']).map((img, i) => (
                <div key={i} className="image-placeholder">
                  {typeof img === 'string' && img.startsWith('blob:') ? <img src={img} alt="project" /> : <div className="image-fallback">Voorbeeld</div>}
                </div>
              ))}
            </div>
            <button className="btn" onClick={() => setShowImage(false)}>Sluiten</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectEditor({ project, onClose, onSave }) {
  const [form, setForm] = useState({ ...project });
  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }
  function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    const blobs = files.map((file) => URL.createObjectURL(file));
    setForm((prev) => ({ ...prev, images: [...prev.images, ...blobs] }));
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Project wijzigen</div>
        <div className="form-grid">
          <input className="input" value={form.name} onChange={(e) => setField('name', e.target.value.toUpperCase())} placeholder="Projectnaam" />
          <input className="input" value={form.expectedDate} type="date" onChange={(e) => setField('expectedDate', e.target.value)} />
          <input className="input full" value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="Volledig adres" />
          <input className="input" value={form.city} onChange={(e) => setField('city', e.target.value)} placeholder="Plaats" />
          <input className="input" value={form.workType} onChange={(e) => setField('workType', e.target.value)} placeholder="Type werk" />
          <select className="select" value={form.category} onChange={(e) => setField('category', e.target.value)}>
            <option value="waterdichting">Waterdichting</option>
            <option value="valbeveiliging">Valbeveiliging</option>
          </select>
          <select className="select" value={form.slotType} onChange={(e) => setField('slotType', e.target.value)}>
            <option value="half">Halve dag</option>
            <option value="full">Hele dag</option>
          </select>
          <input className="input" type="number" min="1" value={form.days} onChange={(e) => setField('days', Number(e.target.value || 1))} placeholder="Aantal dagen" />
          <input className="input" type="number" min="1" value={form.peopleNeeded} onChange={(e) => setField('peopleNeeded', Number(e.target.value || 1))} placeholder="Aantal man" />
          <textarea className="input full textarea" value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="Notities" />
          <div className="full upload-row">
            <label className="btn btn-light small upload-label">
              Afbeeldingen toevoegen
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} />
            </label>
            <span className="muted">{form.images.length} afbeelding(en)</span>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-light" onClick={onClose}>Annuleren</button>
          <button className="btn" onClick={() => onSave(form)}>Opslaan</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('week');
  const [weekStart, setWeekStart] = useState(getMonday(new Date('2026-06-17')));
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [selectedDateForPool, setSelectedDateForPool] = useState(formatDateKey(getMonday(new Date('2026-06-17'))));
  const [monthFilter, setMonthFilter] = useState('2026-06');
  const [projectSearch, setProjectSearch] = useState('');
  const [personSearch, setPersonSearch] = useState('');
  const [rolePreview, setRolePreview] = useState('planner');
  const [monthlyCapacity, setMonthlyCapacity] = useState(320);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '', address: '', city: '', category: 'valbeveiliging', workType: '', expectedDate: '2026-06-24', days: '1', slotType: 'full', peopleNeeded: '2', notes: ''
  });

  const readOnly = rolePreview === 'kijker';
  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const selectedDate = new Date(selectedDateForPool);

  const scheduledByDate = useMemo(() => {
    const map = {};
    for (const date of weekDays) {
      const key = formatDateKey(date);
      map[key] = projects.filter((project) => project.scheduledDays.includes(key));
    }
    return map;
  }, [projects, weekDays]);

  function visiblePeopleForDate(date) {
    return TEAM
      .filter((person) => !personIsUnavailable(person, date))
      .filter((person) => person.name.toLowerCase().includes(personSearch.toLowerCase()));
  }

  function assignedIdsForDate(dateKey) {
    const ids = new Set();
    Object.entries(assignments)
      .filter(([key]) => key.startsWith(`${dateKey}::`))
      .forEach(([, value]) => value.forEach((id) => ids.add(id)));
    return ids;
  }

  const atOfficePeople = useMemo(() => {
    const activePeople = visiblePeopleForDate(selectedDate);
    const assigned = assignedIdsForDate(selectedDateForPool);
    return activePeople.filter((person) => !assigned.has(person.id));
  }, [selectedDateForPool, personSearch, assignments]);

  function peopleLoadForDate(personId, dateKey) {
    let load = 0;
    Object.entries(assignments)
      .filter(([key, value]) => key.startsWith(`${dateKey}::`) && value.includes(personId))
      .forEach(([key]) => {
        const projectId = key.split('::')[1];
        const project = byId(projects, projectId);
        if (project) load += slotLoad(project.slotType);
      });
    return load;
  }

  const openProjects = useMemo(() => {
    return projects
      .filter((project) => project.scheduledDays.length === 0)
      .filter((project) => project.expectedDate.startsWith(monthFilter))
      .filter((project) => `${project.address} ${project.city} ${project.name}`.toLowerCase().includes(projectSearch.toLowerCase()));
  }, [projects, monthFilter, projectSearch]);

  const plannedHours = useMemo(() => {
    return projects.reduce((sum, project) => {
      const perDay = project.peopleNeeded * 8 * slotLoad(project.slotType);
      return sum + project.scheduledDays.length * perDay;
    }, 0);
  }, [projects]);
  const remainingHours = Math.max(monthlyCapacity - plannedHours, 0);
  const usagePercent = monthlyCapacity ? Math.min((plannedHours / monthlyCapacity) * 100, 100) : 0;

  function setProjectField(field, value) {
    setNewProject((prev) => ({ ...prev, [field]: value }));
  }

  function createProject() {
    if (!newProject.name || !newProject.address || !newProject.workType) return;
    setProjects((prev) => [...prev, {
      id: `p${Date.now()}`,
      name: newProject.name.toUpperCase(),
      address: newProject.address,
      city: newProject.city,
      category: newProject.category,
      workType: newProject.workType,
      expectedDate: newProject.expectedDate,
      days: Number(newProject.days),
      slotType: newProject.slotType,
      peopleNeeded: Number(newProject.peopleNeeded),
      notes: newProject.notes,
      images: [],
      scheduledDays: [],
    }]);
    setNewProject({ ...newProject, name: '', address: '', city: '', workType: '', notes: '', days: '1', peopleNeeded: '2' });
  }

  function toggleProjectOnDate(projectId, dateKey) {
    if (readOnly) return;
    setProjects((prev) => prev.map((project) => {
      if (project.id !== projectId) return project;
      const exists = project.scheduledDays.includes(dateKey);
      return { ...project, scheduledDays: exists ? project.scheduledDays.filter((d) => d !== dateKey) : [...project.scheduledDays, dateKey].sort() };
    }));
  }

  function assignPerson(projectId, dateKey, personId) {
    if (readOnly) return;
    const date = new Date(dateKey);
    const person = byId(TEAM, personId);
    if (!person || personIsUnavailable(person, date)) return;
    const key = `${dateKey}::${projectId}`;
    setAssignments((prev) => {
      const current = prev[key] || [];
      if (current.includes(personId)) return prev;
      return { ...prev, [key]: [...current, personId] };
    });
  }

  function removePerson(projectId, dateKey, personId) {
    if (readOnly) return;
    const key = `${dateKey}::${projectId}`;
    setAssignments((prev) => ({ ...prev, [key]: (prev[key] || []).filter((id) => id !== personId) }));
  }

  function saveProject(updated) {
    setProjects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    setEditingProject(null);
  }

  return (
    <div className="app-shell">
      <div className="background-layer" />
      <div className="container">
        <Header
          weekStart={weekStart}
          onPrev={() => { const next = addDays(weekStart, -7); setWeekStart(next); setSelectedDateForPool(formatDateKey(next)); }}
          onNext={() => { const next = addDays(weekStart, 7); setWeekStart(next); setSelectedDateForPool(formatDateKey(next)); }}
          rolePreview={rolePreview}
          setRolePreview={setRolePreview}
        />
        <Tabs tab={tab} setTab={setTab} />

        {tab === 'week' && (
          <div className="layout-grid">
            <div className="sidebar-col">
              <div className="panel section">
                <div className="section-title">Monteurpool</div>
                <input className="input" value={personSearch} onChange={(e) => setPersonSearch(e.target.value)} placeholder="Zoek monteur" />
                <select className="select" value={selectedDateForPool} onChange={(e) => setSelectedDateForPool(e.target.value)}>
                  {weekDays.map((day) => <option key={formatDateKey(day)} value={formatDateKey(day)}>{WEEKDAYS[(day.getDay() + 6) % 7]} · {prettyDay(day)}</option>)}
                </select>
                <div className="office-box">
                  <div className="office-title">Aan de zaak</div>
                  <div className="office-subtitle">Nog niet toegewezen op {prettyDay(selectedDate)}</div>
                  <div className="stack">
                    {atOfficePeople.map((person) => {
                      const load = peopleLoadForDate(person.id, selectedDateForPool);
                      return (
                        <div key={person.id} className="person-row">
                          <div>
                            <div className="person-name">{person.name}</div>
                            <div className={`person-load ${load > 1 ? 'danger' : load === 1 ? 'warn' : ''}`}>{Math.round(load * 8)}/8 uur</div>
                          </div>
                          <div className="person-actions">
                            {(scheduledByDate[selectedDateForPool] || []).map((project) => (
                              <button key={project.id} className="btn btn-light tiny" onClick={() => assignPerson(project.id, selectedDateForPool, person.id)} disabled={readOnly}>
                                Naar {project.name.slice(0, 8)}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {!atOfficePeople.length && <div className="muted-box">Niemand beschikbaar voor deze dag.</div>}
                  </div>
                </div>
                <div className="hint-box">Het vinkje voor automatische controle zit nog niet als echte workflow in deze versie. De logica voor bezetting en vrije dagen is wel al meegenomen.</div>
              </div>

              <div className="panel section">
                <div className="section-title">Nieuw project</div>
                <div className="stack small-gap">
                  <input className="input" value={newProject.name} onChange={(e) => setProjectField('name', e.target.value)} placeholder="Projectnaam" />
                  <input className="input" value={newProject.address} onChange={(e) => setProjectField('address', e.target.value)} placeholder="Volledig adres" />
                  <input className="input" value={newProject.city} onChange={(e) => setProjectField('city', e.target.value)} placeholder="Woonplaats" />
                  <input className="input" value={newProject.workType} onChange={(e) => setProjectField('workType', e.target.value)} placeholder="Type werk" />
                  <div className="two-col">
                    <select className="select" value={newProject.category} onChange={(e) => setProjectField('category', e.target.value)}>
                      <option value="waterdichting">Waterdichting</option>
                      <option value="valbeveiliging">Valbeveiliging</option>
                    </select>
                    <input className="input" type="date" value={newProject.expectedDate} onChange={(e) => setProjectField('expectedDate', e.target.value)} />
                  </div>
                  <div className="three-col">
                    <input className="input" type="number" min="1" value={newProject.days} onChange={(e) => setProjectField('days', e.target.value)} placeholder="Dagen" />
                    <select className="select" value={newProject.slotType} onChange={(e) => setProjectField('slotType', e.target.value)}>
                      <option value="half">Halve dag</option>
                      <option value="full">Hele dag</option>
                    </select>
                    <input className="input" type="number" min="1" value={newProject.peopleNeeded} onChange={(e) => setProjectField('peopleNeeded', e.target.value)} placeholder="Aantal man" />
                  </div>
                  <textarea className="input textarea" value={newProject.notes} onChange={(e) => setProjectField('notes', e.target.value)} placeholder="Notities" />
                  <button className="btn" onClick={createProject} disabled={readOnly}>Project toevoegen</button>
                </div>
              </div>
            </div>

            <div className="panel week-panel">
              <div className="week-header">
                <div>
                  <div className="section-title">{MONTHS[weekStart.getMonth()]} · week {weekNumber(weekStart)}</div>
                  <div className="section-subtitle">Optie A: bovenaan “Aan de zaak”, daaronder de projectkaarten per dag.</div>
                </div>
                {readOnly && <div className="readonly-badge">Alleen lezen</div>}
              </div>
              <div className="week-grid">
                {weekDays.map((day) => {
                  const dateKey = formatDateKey(day);
                  const companyHoliday = dateIsCompanyHoliday(dateKey);
                  const projectsToday = scheduledByDate[dateKey] || [];
                  const visiblePeople = visiblePeopleForDate(day);
                  return (
                    <div key={dateKey} className={`day-column ${companyHoliday ? 'locked' : ''}`}>
                      <div className="day-head">
                        <div>
                          <div className="day-title">{WEEKDAYS[(day.getDay() + 6) % 7]}</div>
                          <div className="day-date">{prettyDay(day)}</div>
                        </div>
                        {!companyHoliday && <button className="btn btn-light tiny" onClick={() => setSelectedDateForPool(dateKey)}>Selecteer</button>}
                        {companyHoliday && <span className="pill red">Op slot</span>}
                      </div>

                      <div className="availability-box">
                        <div className="availability-title">Beschikbare monteurs</div>
                        <div className="people-stack">
                          {visiblePeople.map((person) => {
                            const load = peopleLoadForDate(person.id, dateKey);
                            return (
                              <div key={person.id} className="availability-person">
                                <span>{person.name}</span>
                                <span className={`person-load ${load > 1 ? 'danger' : load === 1 ? 'warn' : ''}`}>{Math.round(load * 8)}/8u {load > 1 ? '⚠' : ''}</span>
                              </div>
                            );
                          })}
                          {!visiblePeople.length && <div className="muted">Geen monteurs beschikbaar.</div>}
                        </div>
                      </div>

                      <div className="project-stack">
                        {!projectsToday.length && !companyHoliday && <div className="muted-box">Nog geen projecten ingepland op deze dag.</div>}
                        {projectsToday.map((project) => (
                          <ProjectCard
                            key={`${dateKey}-${project.id}`}
                            project={project}
                            dateKey={dateKey}
                            team={visiblePeople}
                            assignedIds={assignments[`${dateKey}::${project.id}`] || []}
                            onAssign={assignPerson}
                            onRemove={removePerson}
                            onEdit={setEditingProject}
                            readOnly={readOnly}
                          />
                        ))}
                      </div>

                      {!companyHoliday && !readOnly && (
                        <details className="planner-details">
                          <summary>Project plannen op deze dag</summary>
                          <div className="stack small-gap planner-list">
                            {projects.map((project) => {
                              const active = project.scheduledDays.includes(dateKey);
                              return (
                                <div key={project.id} className="planner-row">
                                  <div>
                                    <div className="planner-name">{project.name}</div>
                                    <div className="planner-address">{project.address}</div>
                                  </div>
                                  <button className={active ? 'btn btn-light tiny' : 'btn tiny'} onClick={() => toggleProjectOnDate(project.id, dateKey)}>
                                    {active ? 'Verwijder' : 'Plan in'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'open' && (
          <div className="layout-grid-open">
            <div className="panel section">
              <div className="section-title">Filter open projecten</div>
              <div className="stack">
                <select className="select" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                  <option value="2026-06">Juni 2026</option>
                  <option value="2026-07">Juli 2026</option>
                  <option value="2026-08">Augustus 2026</option>
                </select>
                <input className="input" value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} placeholder="Zoek op adres of woonplaats" />
                <div className="hint-box">Hier zie je alleen projecten met een verwachte datum in de gekozen maand die nog niet zijn ingepland.</div>
              </div>
            </div>
            <div className="stack">
              {openProjects.map((project) => (
                <div key={project.id} className="panel open-card">
                  <div className="open-main">
                    <div>
                      <div className="open-title">{project.name}</div>
                      <div className="open-address">{project.address}</div>
                      <div className="open-city">{project.city}</div>
                      <div className="open-work">{project.workType}</div>
                      <div className="open-notes">{project.notes}</div>
                    </div>
                    <div className="open-metrics">
                      <div className="metric"><span>Verwachte datum</span><strong>{project.expectedDate.split('-').reverse().join('-')}</strong></div>
                      <div className="metric"><span>Duur</span><strong>{project.days} dag(en)</strong></div>
                      <div className="metric"><span>Dagdeel</span><strong>{slotLabel(project.slotType)}</strong></div>
                      <div className="metric"><span>Benodigde man</span><strong>{project.peopleNeeded}</strong></div>
                    </div>
                  </div>
                </div>
              ))}
              {!openProjects.length && <div className="panel muted-box">Geen open projecten gevonden voor deze maandfilter.</div>}
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="settings-grid">
            <div className="panel section">
              <div className="section-title">Rechten</div>
              <div className="stack">
                <div className="role-card"><strong>Beheerder</strong><span>Alles aanpassen, instellingen en rechten beheren.</span></div>
                <div className="role-card"><strong>Planner</strong><span>Projecten en planning wijzigen, geen gebruikersbeheer.</span></div>
                <div className="role-card"><strong>Kijker</strong><span>Alleen lezen, geen wijzigingen mogelijk.</span></div>
                <div className="hint-box">In een echte live versie koppel ik dit aan login en database-rechten.</div>
              </div>
            </div>
            <div className="panel section">
              <div className="section-title">Capaciteit per maand</div>
              <div className="stack">
                <label className="label">Beschikbare manuren</label>
                <input className="input" type="number" value={monthlyCapacity} onChange={(e) => setMonthlyCapacity(Number(e.target.value) || 0)} />
                <div className="stats-grid">
                  <div className="stat-card"><span>Ingepland</span><strong>{plannedHours} uur</strong></div>
                  <div className="stat-card"><span>Over</span><strong>{remainingHours} uur</strong></div>
                </div>
                <div className="progress-wrap">
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${usagePercent}%` }} /></div>
                  <div className="muted">Gebruik: {Math.round(usagePercent)}%</div>
                </div>
              </div>
            </div>
            <div className="panel section">
              <div className="section-title">Vrije dagen</div>
              <div className="stack">
                <div>
                  <div className="label">Bedrijfsvrij</div>
                  {COMPANY_HOLIDAYS.map((holiday) => <div key={holiday.date} className="holiday-card red"><strong>{holiday.date.split('-').reverse().join('-')}</strong><span>{holiday.label}</span></div>)}
                </div>
                <div>
                  <div className="label">Persoonlijk vrij</div>
                  {PERSONAL_HOLIDAYS.map((holiday, idx) => <div key={idx} className="holiday-card"><strong>{byId(TEAM, holiday.personId)?.name}</strong><span>{holiday.date.split('-').reverse().join('-')} · {holiday.label}</span></div>)}
                </div>
                <div className="hint-box">Monteurs die vrij zijn worden niet bovenaan getoond op die dag.</div>
              </div>
            </div>
          </div>
        )}
      </div>
      {editingProject && <ProjectEditor project={editingProject} onClose={() => setEditingProject(null)} onSave={saveProject} />}
    </div>
  );
}
