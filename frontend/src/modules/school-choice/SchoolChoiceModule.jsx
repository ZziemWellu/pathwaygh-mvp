import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CircleCheck, Printer, School, TriangleAlert } from 'lucide-react';
import api, { extractErrorMessage } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import './SchoolChoice.css';

const emptyRow = () => ({ school: '', category: '', mode: '', programme: '' });

// Blank selects are '' in the form but null to the API.
const toRequest = (rows) =>
  rows.map((row) => ({ ...row, category: row.category || null, mode: row.mode || null }));

const fromResponse = (choices, total) => {
  const rows = (choices || []).map((c) => ({ ...emptyRow(), ...c, category: c.category || '', mode: c.mode || '' }));
  while (rows.length < total) rows.push(emptyRow());
  return rows.slice(0, total);
};

const SchoolChoiceModule = () => {
  const [rules, setRules] = useState(null);
  const [rows, setRows] = useState([]);
  const [check, setCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [rulesResponse, draftResponse] = await Promise.all([
          api.get('/api/school-choice/rules'),
          api.get('/api/school-choice/draft'),
        ]);
        const loadedRules = rulesResponse.data.rules;
        setRules(loadedRules);
        setRows(fromResponse(draftResponse.data.choices, loadedRules.total_choices));
        setCheck(draftResponse.data.check);
      } catch (err) {
        setError(extractErrorMessage(err, 'Could not load the school-choice helper.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Live counts as the student types. The rules themselves are checked by the
  // server when they save, so there's one source of truth for them.
  const counts = useMemo(() => {
    const filled = rows.filter((row) => row.school.trim());
    const count = (test) => filled.filter(test).length;
    return {
      total: filled.length,
      A: count((r) => r.category === 'A'),
      B: count((r) => r.category === 'B'),
      C: count((r) => r.category === 'C'),
      boarding: count((r) => r.mode === 'boarding'),
      day: count((r) => r.mode === 'day'),
    };
  }, [rows]);

  const updateRow = (index, field, value) => {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    setDirty(true);
  };

  const moveRow = (index, change) => {
    setRows((current) => {
      const next = [...current];
      [next[index], next[index + change]] = [next[index + change], next[index]];
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await api.put('/api/school-choice/draft', { choices: toRequest(rows) });
      setCheck(response.data.check);
      setDirty(false);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save your list. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="school-choice"><p>Loading…</p></div>;
  }

  if (!rules) {
    return (
      <div className="school-choice">
        <PageHeader icon={School} title="School choice helper" />
        <p role="alert" className="school-choice__error">{error}</p>
      </div>
    );
  }

  const meters = [
    { label: 'Schools', value: counts.total, max: rules.total_choices },
    { label: 'Category A', value: counts.A, max: rules.max_category_a },
    { label: 'Category B', value: counts.B, max: rules.max_category_b },
    { label: 'Category C', value: counts.C },
    { label: 'Boarding', value: counts.boarding, max: rules.max_boarding },
    { label: 'Day', value: counts.day, max: rules.max_day },
  ];

  return (
    <div className="school-choice">
      <PageHeader
        icon={School}
        title="School choice helper"
        subtitle={`Plan your ${rules.total_choices} CSSPS choices and check them against the ${rules.year} rules`}
      />

      <section className="card school-choice__rules">
        <h2>The {rules.year} rules</h2>
        <ul>
          <li>Choose {rules.total_choices} schools, with your favourite first.</li>
          <li>At most {rules.max_category_a} Category A and {rules.max_category_b} Category B schools. The rest come from Category C.</li>
          <li>At most {rules.max_boarding} boarding and {rules.max_day} day schools.</li>
          <li>You can only choose each school once.</li>
        </ul>
        <p className="school-choice__note">{rules.category_a_note}</p>
        <p className="school-choice__note"><strong>{rules.year_note}</strong></p>
        <p className="school-choice__note">{rules.not_covered}</p>
      </section>

      <div className="school-choice__meters" aria-live="polite">
        {meters.map(({ label, value, max }) => (
          <div key={label} className={`school-choice__meter${max !== undefined && value > max ? ' is-over' : ''}`}>
            <strong>{max !== undefined ? `${value}/${max}` : value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <ol className="school-choice__list">
        {rows.map((row, index) => (
          <li key={index} className="card school-choice__row">
            <div className="school-choice__rank">
              <strong>Choice {index + 1}</strong>
              <span className="school-choice__move">
                <button type="button" aria-label={`Move choice ${index + 1} up`} disabled={index === 0} onClick={() => moveRow(index, -1)}>
                  <ArrowUp size={16} aria-hidden="true" />
                </button>
                <button type="button" aria-label={`Move choice ${index + 1} down`} disabled={index === rows.length - 1} onClick={() => moveRow(index, 1)}>
                  <ArrowDown size={16} aria-hidden="true" />
                </button>
              </span>
            </div>
            <div className="school-choice__fields">
              <label className="school-choice__school">
                School
                <input type="text" maxLength={200} value={row.school} onChange={(e) => updateRow(index, 'school', e.target.value)} placeholder="Name as it appears in the register" />
              </label>
              <label>
                Category
                <select value={row.category} onChange={(e) => updateRow(index, 'category', e.target.value)}>
                  <option value="">Choose</option>
                  {rules.categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label>
                Boarding or day
                <select value={row.mode} onChange={(e) => updateRow(index, 'mode', e.target.value)}>
                  <option value="">Choose</option>
                  <option value="boarding">Boarding</option>
                  <option value="day">Day</option>
                </select>
              </label>
              <label className="school-choice__programme">
                Programme
                <input type="text" maxLength={100} value={row.programme} onChange={(e) => updateRow(index, 'programme', e.target.value)} placeholder="For example, General Science" />
              </label>
            </div>
          </li>
        ))}
      </ol>

      <div className="school-choice__actions">
        <Button onClick={save} disabled={saving}>{saving ? 'Checking…' : 'Save and check my list'}</Button>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" /> Print
        </Button>
      </div>

      {error && <p role="alert" className="school-choice__error">{error}</p>}

      {check && !dirty && (
        <section className="card school-choice__result" aria-live="polite">
          {check.complete && (
            <p className="school-choice__ok">
              <CircleCheck size={18} aria-hidden="true" /> Your list follows the {rules.year} rules. Check it with your parent and teacher before you fill in the official form.
            </p>
          )}
          {check.errors.map((message) => (
            <p key={message} className="school-choice__problem">
              <TriangleAlert size={18} aria-hidden="true" /> {message}
            </p>
          ))}
          {check.reminders.map((message) => <p key={message}>{message}</p>)}
        </section>
      )}
      {dirty && check && <p className="school-choice__note">You have changes that haven&apos;t been checked yet.</p>}

      <section className="card school-choice__tips">
        <h2>Before you decide</h2>
        <ul>
          {rules.tips.map((tip) => <li key={tip}>{tip}</li>)}
        </ul>
      </section>

      <p className="school-choice__note">
        {rules.disclaimer} Source: <a href={rules.source_url} target="_blank" rel="noopener noreferrer">{rules.source_name}</a>.
      </p>
    </div>
  );
};

export default SchoolChoiceModule;
