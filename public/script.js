// script.js - clean and easy to read
const API = '/api/students';

const addForm = document.getElementById('addForm');
const studentsList = document.getElementById('studentsList');

/* ---------- Helpers ---------- */
function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function createElementFromHTML(html) {
  const div = document.createElement('div');
  div.innerHTML = html.trim();
  return div.firstChild;
}

/* ---------- Fetch / Load ---------- */
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    // try to parse json error
    const err = await res.json().catch(() => null);
    throw err || new Error('Network error');
  }
  return res.json();
}

async function loadStudents() {
  studentsList.innerHTML = '<div class="small">Loading...</div>';

  try {
    const data = await fetchJSON(API);

    if (!data.length) {
      studentsList.innerHTML = '<div class="small">No students yet.</div>';
      return;
    }

    // build cards
    studentsList.innerHTML = '';
    data.forEach((s) => {
      const card = createElementFromHTML(studentCardHtml(s));
      studentsList.appendChild(card);
    });

    attachListHandlers();
  } catch (err) {
    console.error(err);
    studentsList.innerHTML = '<div class="small">Failed to load.</div>';
  }
}

/* ---------- UI Templates ---------- */
function studentCardHtml(s) {
  return `
    <div class="student" data-id="${s._id}">
      <div class="left">
        <h3 class="name">${escapeHtml(s.name)}</h3>
        <p class="small meta">
          Roll: <span class="roll">${escapeHtml(s.rollNumber)}</span> •
          ${escapeHtml(s.course)} • Sem ${escapeHtml(s.semester)}
        </p>
        <p class="small">
          Phone: <span class="phone">${escapeHtml(s.phone || '—')}</span> •
          Email: <span class="email">${escapeHtml(s.email || '—')}</span>
        </p>
      </div>

      <div class="controls">
        <button class="btn edit">Edit</button>
        <button class="btn delete">Delete</button>
      </div>
    </div>
  `;
}

/* ---------- Handlers ---------- */
function attachListHandlers() {
  // delete buttons
  document.querySelectorAll('.btn.delete').forEach((b) => {
    b.addEventListener('click', async (e) => {
      const card = e.target.closest('.student');
      const id = card.dataset.id;
      if (!confirm('Delete this student?')) return;

      try {
        await fetchJSON(`${API}/${id}`, { method: 'DELETE' });
        await loadStudents();
      } catch (err) {
        alert(err.error || 'Delete failed');
      }
    });
  });

  // edit buttons
  document.querySelectorAll('.btn.edit').forEach((b) => {
    b.addEventListener('click', (e) => {
      const card = e.target.closest('.student');
      enterEditMode(card);
    });
  });
}

/* ---------- Edit Mode (inline) ---------- */
function enterEditMode(card) {
  const id = card.dataset.id;

  // grab current values
  const name = card.querySelector('.name').textContent;
  const roll = card.querySelector('.roll').textContent;
  const metaText = card.querySelector('.meta').textContent;
  const course = card.querySelector('.meta').textContent.split('•')[1] || '';
  const semMatch = metaText.match(/Sem\s*(\S+)/);
  const semester = semMatch ? semMatch[1] : '';
  const phone = card.querySelector('.phone').textContent;
  const email = card.querySelector('.email').textContent;

  // build edit UI
  card.innerHTML = `
    <div style="flex:1">
      <input class="edit-name" value="${escapeForInput(name)}" placeholder="Name" />
      <div style="display:flex;gap:8px;margin-top:6px">
        <input class="edit-roll" value="${escapeForInput(roll)}" placeholder="Roll number" />
        <input class="edit-course" value="${escapeForInput(course.trim())}" placeholder="Course" />
        <input class="edit-sem" value="${escapeForInput(semester)}" placeholder="Semester" />
      </div>
      <div style="display:flex;gap:8px;margin-top:6px">
        <input class="edit-phone" value="${escapeForInput(phone)}" placeholder="Phone" />
        <input class="edit-email" value="${escapeForInput(email)}" placeholder="Email" />
      </div>
    </div>

    <div class="controls">
      <button class="btn save">Save</button>
      <button class="btn cancel">Cancel</button>
    </div>
  `;

  // wire save & cancel
  card.querySelector('.btn.save').addEventListener('click', () => saveEdit(card, id));
  card.querySelector('.btn.cancel').addEventListener('click', () => loadStudents());
}

function escapeForInput(s) {
  return (s || '').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

async function saveEdit(card, id) {
  const payload = {
    name: card.querySelector('.edit-name').value.trim(),
    rollNumber: card.querySelector('.edit-roll').value.trim(),
    course: card.querySelector('.edit-course').value.trim(),
    semester: card.querySelector('.edit-sem').value.trim(),
    phone: card.querySelector('.edit-phone').value.trim(),
    email: card.querySelector('.edit-email').value.trim(),
  };

  if (!payload.name || !payload.rollNumber || !payload.course || !payload.semester) {
    return alert('Please fill name, roll number, course and semester.');
  }

  try {
    await fetchJSON(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await loadStudents();
  } catch (err) {
    alert(err.error || 'Update failed');
  }
}

/* ---------- Add student ---------- */
addForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = new FormData(addForm);
  const body = {
    name: form.get('name').trim(),
    semester: form.get('semester').trim(),
    course: form.get('course').trim(),
    rollNumber: form.get('rollNumber').trim(),
    phone: form.get('phone').trim(),
    email: form.get('email').trim(),
  };

  if (!body.name || !body.semester || !body.course || !body.rollNumber) {
    return alert('Please fill name, semester, course and roll number.');
  }

  try {
    await fetchJSON(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    addForm.reset();
    loadStudents();
  } catch (err) {
    alert(err.error || 'Add failed');
  }
});

/* ---------- Init ---------- */
loadStudents();
