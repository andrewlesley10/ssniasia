/* Tour enquiry form — AJAX submit to contact.php with a confirmation panel.
   Without JS the form still posts normally and contact.php redirects back
   here with ?status=…&message=…, which this script also understands. */
document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('enquiry-form');
  var statusBox = document.getElementById('form-status');
  var submitBtn = document.getElementById('enquiry-submit');
  var confirmBox = document.getElementById('enquiry-confirm');
  var againBtn = document.getElementById('enquiry-again');
  if (!form || !statusBox || !submitBtn) return;

  var defaultLabel = submitBtn.textContent.trim();
  var message = form.elements.message;

  /* ---- prefill from links: ?tour=… or ?destination=… ---- */
  try {
    var params = new URLSearchParams(window.location.search);
    var picks = [];
    if (params.get('tour')) picks.push(params.get('tour'));
    if (params.get('destination')) picks.push(params.get('destination'));
    if (picks.length && message && !message.value) {
      message.value = ("I'm interested in: " + picks.join(', ') + '.\n\n').slice(0, 1000);
    }
  } catch (e) { /* URLSearchParams unsupported — nothing to prefill */ }

  function showStatus(success, message) {
    statusBox.hidden = false;
    statusBox.className = 'form-feedback form-feedback--' + (success ? 'success' : 'error');
    statusBox.textContent = message;
    statusBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function hideStatus() {
    statusBox.hidden = true;
    statusBox.textContent = '';
  }
  function showConfirmation() {
    if (!confirmBox) { showStatus(true, 'Thank you! Your tour enquiry has been sent.'); return; }
    form.hidden = true;
    confirmBox.hidden = false;
    confirmBox.focus({ preventScroll: true });
    confirmBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (againBtn) {
    againBtn.addEventListener('click', function () {
      confirmBox.hidden = true;
      form.hidden = false;
      hideStatus();
      form.elements.fullName.focus();
    });
  }

  /* ---- non-JS fallback round trip: contact?status=…&message=… ---- */
  try {
    var qs = new URLSearchParams(window.location.search);
    if (qs.get('status') === 'success') showConfirmation();
    else if (qs.get('status') === 'error' && qs.get('message')) showStatus(false, qs.get('message'));
  } catch (e) {}

  /* mark invalid fields for assistive tech as people correct them */
  form.addEventListener('input', function (e) {
    if (e.target.hasAttribute('aria-invalid') && e.target.checkValidity()) e.target.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    hideStatus();

    if (!form.checkValidity()) {
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.willValidate && !el.checkValidity()) el.setAttribute('aria-invalid', 'true');
      });
      form.reportValidity();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    fetch(form.getAttribute('action') || 'contact.php', {
      method: 'POST',
      body: new FormData(form),
      headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' }
    })
      .then(function (response) {
        return response.text().then(function (text) {
          try { return JSON.parse(text); }
          catch (err) { return { success: false, message: 'Unexpected server response. Please try again, or call us on +94 11 478 9644.' }; }
        });
      })
      .then(function (data) {
        if (data && data.success) {
          form.reset();
          showConfirmation();
        } else {
          showStatus(false, (data && data.message) || 'Something went wrong. Please try again.');
        }
      })
      .catch(function () {
        showStatus(false, 'Could not send your enquiry. Please check your connection and try again, or email info@ssniasia.com.');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = defaultLabel;
      });
  });
});
