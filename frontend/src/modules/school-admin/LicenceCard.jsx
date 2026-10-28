import React, { useEffect, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import api, { extractErrorMessage } from '../../services/api';
import { formatDate } from '../../utils/date';
import Button from '../../components/ui/Button';

const CURRENCY_SYMBOLS = { GHS: 'GHS', NGN: '₦' };

export const formatMoney = (minor, currency) =>
  `${CURRENCY_SYMBOLS[currency] || currency} ${(minor / 100).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const PLAN_BADGES = {
  trial: 'Free first term',
  paid: 'Licence active',
  grace: 'Grace period',
  free: 'Free plan',
};

const INCLUDED = [
  'Unlimited students',
  'Progress for every student, with a spreadsheet download',
  'Weekly WhatsApp summary for the school admin',
  'More AI tutor time for your students',
  "Your school's name on students' certificates",
];

const day = (value) => formatDate(value, { long: true });

const StatusLine = ({ licence }) => {
  switch (licence.plan) {
    case 'trial':
      return (
        <p>
          Your first term is free, with every licence feature included, until <strong>{day(licence.valid_until)}</strong>.
        </p>
      );
    case 'paid':
      return (
        <p>
          Active until <strong>{day(licence.valid_until)}</strong>. {licence.students} of {licence.seat_limit} seats in use.
          {licence.renewal_queued && licence.paid_through && <> Already renewed through {day(licence.paid_through)}.</>}
        </p>
      );
    case 'grace':
      return (
        <p>
          Your licence ended on {day(licence.valid_until)}. Everything keeps working until{' '}
          <strong>{day(licence.grace_until)}</strong>, then the school moves to the free plan.
        </p>
      );
    default:
      return (
        <p>
          {licence.students} of {licence.seat_limit} students on the free plan, with school-wide totals only. Students can
          always keep learning, with or without a licence.
        </p>
      );
  }
};

const PaymentResult = ({ result }) => {
  if (result.status === 'success') {
    return (
      <div className="licence-card__notice licence-card__notice--ok" role="status">
        Payment confirmed: {formatMoney(result.amount_minor_units, result.currency)}.
        {result.licence?.valid_until && <> Your licence is active until {day(result.licence.valid_until)}.</>}
      </div>
    );
  }
  if (result.status === 'amount_mismatch') {
    return (
      <div className="licence-card__notice licence-card__notice--warn" role="alert">
        The amount paid didn't match the quote, so the licence wasn't activated. Please contact support with reference{' '}
        <strong>{result.reference}</strong>.
      </div>
    );
  }
  return (
    <div className="licence-card__notice licence-card__notice--warn" role="status">
      Payment status: {result.status}. If you completed checkout, it can take a minute to confirm. Refresh this page to
      check again.
    </div>
  );
};

const LicenceCard = ({ onLicenceChange }) => {
  const [quote, setQuote] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [paying, setPaying] = useState(null);
  const [payError, setPayError] = useState(null);
  const [result, setResult] = useState(null);
  const [extraSeats, setExtraSeats] = useState(10);

  const loadQuote = async () => {
    try {
      const response = await api.get('/api/payment/quote');
      setQuote(response.data);
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Could not load your licence details.'));
    }
  };

  const checkReturnFromCheckout = async () => {
    const reference = new URLSearchParams(window.location.search).get('payment_reference');
    if (!reference) return;
    // Clear the query param so a refresh doesn't re-verify a settled payment.
    window.history.replaceState({}, '', window.location.pathname);
    try {
      const response = await api.get(`/api/payment/verify/${reference}`);
      setResult(response.data);
      if (response.data.status === 'success') onLicenceChange?.();
    } catch (err) {
      setPayError(extractErrorMessage(err, 'Could not confirm payment status. Check back shortly.'));
    }
  };

  useEffect(() => {
    // Verify first so the quote reflects a just-activated licence.
    checkReturnFromCheckout().finally(loadQuote);
  }, []);

  const pay = async (plan) => {
    setPaying(plan);
    setPayError(null);
    try {
      const body = plan === 'top_up' ? { provider: 'paystack', plan, extra_seats: extraSeats } : { provider: 'paystack', plan };
      const response = await api.post('/api/payment/initialize', body);
      window.location.href = response.data.checkout_url;
    } catch (err) {
      setPayError(extractErrorMessage(err, 'Could not start payment. Please try again.'));
      setPaying(null);
    }
  };

  const licence = quote?.licence;
  const options = quote?.options || [];
  const term = options.find((o) => o.kind === 'term');
  const year = options.find((o) => o.kind === 'year');
  const verb = licence && ['paid', 'grace'].includes(licence.plan) ? 'Renew' : 'Pay';

  return (
    <section className="card licence-card" aria-labelledby="licence-heading">
      <div className="licence-card__head">
        <h3 id="licence-heading">School licence</h3>
        {licence && <span className={`licence-card__badge licence-card__badge--${licence.plan}`}>{PLAN_BADGES[licence.plan]}</span>}
      </div>

      {result && <PaymentResult result={result} />}
      {payError && <p className="licence-card__error" role="alert">{payError}</p>}
      {loadError && <p className="licence-card__error">{loadError}</p>}
      {!quote && !loadError && <p className="licence-card__muted">Loading licence…</p>}

      {licence && (
        <>
          <div className="licence-card__status"><StatusLine licence={licence} /></div>

          {licence.can_buy && term && year && !licence.renewal_queued && (
            <>
              <div className="licence-card__options">
                <div className="licence-option">
                  <div className="licence-option__name">One term</div>
                  <div className="licence-option__price">{formatMoney(term.amount_minor_units, term.currency)}</div>
                  <div className="licence-option__detail">
                    {formatMoney(term.price_per_student_minor, term.currency)} per student · {day(term.starts_on)} to{' '}
                    {day(term.valid_until)}
                  </div>
                  <Button variant="secondary" onClick={() => pay('term')} disabled={!!paying}>
                    {paying === 'term' ? 'Opening checkout…' : `${verb} for one term`}
                  </Button>
                </div>
                <div className="licence-option licence-option--best">
                  <div className="licence-option__name">
                    Full year <span className="licence-option__save">Best value</span>
                  </div>
                  <div className="licence-option__price">{formatMoney(year.amount_minor_units, year.currency)}</div>
                  <div className="licence-option__detail">
                    {formatMoney(year.price_per_student_minor, year.currency)} per student · {day(year.starts_on)} to{' '}
                    {day(year.valid_until)}
                  </div>
                  <Button onClick={() => pay('year')} disabled={!!paying}>
                    {paying === 'year' ? 'Opening checkout…' : `${verb} for the year`}
                  </Button>
                </div>
              </div>
              <p className="licence-card__muted">
                Billed for {year.billed_students} students
                {year.billed_students > year.students && ' (the minimum)'}, with {year.seats} seats so new students can
                join mid-term. Pay by Mobile Money or card through Paystack.
              </p>
            </>
          )}

          {licence.plan === 'paid' && licence.can_buy && (
            <div className="licence-card__topup">
              <label htmlFor="extra-seats">Need more seats?</label>
              <input
                id="extra-seats"
                type="number"
                min="1"
                max="5000"
                value={extraSeats}
                onChange={(e) => setExtraSeats(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
              <Button variant="secondary" size="sm" onClick={() => pay('top_up')} disabled={!!paying}>
                {paying === 'top_up' ? 'Opening checkout…' : 'Add seats'}
              </Button>
              <span className="licence-card__muted">Charged only for the rest of this period.</span>
            </div>
          )}

          {!licence.can_buy && (
            <p className="licence-card__muted">Online payment isn't available in your country yet. Contact us to set up a licence.</p>
          )}

          {licence.plan !== 'paid' && (
            <ul className="licence-card__included" aria-label="Included in the licence">
              {INCLUDED.map((item) => (
                <li key={item}>
                  <BadgeCheck size={16} aria-hidden="true" /> {item}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
};

export default LicenceCard;
