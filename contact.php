<?php
declare(strict_types=1);

/* Tour enquiry handler for the contact page.
   AJAX requests get JSON; plain form posts are redirected back to
   /contact?status=…&message=… so the page can show the result. */

const MAIL_TO = 'info@ssniasia.com';
const MAIL_FROM = 'no-reply@ssniasia.com';
const PHONE = '+94 11 478 9644';

function is_ajax_request(): bool
{
    $xhr = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';

    return strcasecmp($xhr, 'XMLHttpRequest') === 0
        || str_contains($accept, 'application/json');
}

function respond(bool $success, string $message, int $code = 200): void
{
    if (is_ajax_request()) {
        http_response_code($code);
        header('Content-Type: application/json; charset=UTF-8');
        header('Cache-Control: no-store');
        echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $query = http_build_query([
        'status' => $success ? 'success' : 'error',
        'message' => $message,
    ]);
    header('Location: contact?' . $query . '#enquiry', true, 303);
    exit;
}

/**
 * Per-IP submission cap, kept in a small JSON file per address.
 *
 * Deliberately fails OPEN: if the temp directory isn't writable we let the
 * enquiry through rather than blocking a real traveller. The point is to stop
 * bulk automated posting, not to be an access control.
 */
function within_rate_limit(string $ip, int $max = 5, int $window = 3600): bool
{
    $dir = sys_get_temp_dir() . '/ssni_enquiry';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return true;
    }

    $handle = @fopen($dir . '/' . hash('sha256', $ip) . '.json', 'c+');
    if ($handle === false) {
        return true;
    }

    @flock($handle, LOCK_EX);
    $now = time();
    $decoded = json_decode((string) stream_get_contents($handle), true);
    $hits = is_array($decoded)
        ? array_values(array_filter($decoded, static fn($t) => is_int($t) && $t > $now - $window))
        : [];

    $allowed = count($hits) < $max;
    if ($allowed) {
        $hits[] = $now;
    }

    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, (string) json_encode($hits));
    @flock($handle, LOCK_UN);
    fclose($handle);

    return $allowed;
}

/** Collapse anything that could break out of a mail header. */
function header_safe(string $value): string
{
    return trim(preg_replace('/[\r\n\t]+/', ' ', $value) ?? '');
}

function field(string $name): string
{
    $value = $_POST[$name] ?? '';
    return is_string($value) ? trim($value) : '';
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    if (is_ajax_request()) {
        respond(false, 'Invalid request method.', 405);
    }
    header('Location: contact');
    exit;
}

/* Honeypot: a field hidden from people but not from most bots. Anything that
   fills it gets a success response — telling a bot it failed just teaches it
   to try again differently. */
if (field('website') !== '') {
    respond(true, 'Thank you! Your tour enquiry has been sent.');
}

if (!within_rate_limit($_SERVER['REMOTE_ADDR'] ?? 'unknown')) {
    respond(false, 'Too many enquiries from this connection. Please try again later, or call us on ' . PHONE . '.', 429);
}

$data = [
    'fullName' => field('fullName'),
    'email' => field('email'),
    'phone' => field('phone'),
    'country' => field('country'),
    'message' => field('message'),
];

/* Length caps, so a single POST can't drop a novel into the inbox. */
$limits = ['fullName' => 120, 'email' => 254, 'phone' => 40, 'country' => 80, 'message' => 5000];

$errors = [];

if ($data['fullName'] === '') {
    $errors[] = 'Please enter your full name.';
}
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}
if ($data['message'] === '') {
    $errors[] = 'Please tell us a little about your trip.';
}
foreach ($limits as $name => $max) {
    if (mb_strlen($data[$name]) > $max) {
        $errors[] = 'One of your entries is too long — please shorten it.';
        break;
    }
}

if ($errors) {
    respond(false, implode(' ', $errors), 422);
}

$labels = [
    'fullName' => 'Full name',
    'email' => 'Email',
    'phone' => 'Phone / WhatsApp',
    'country' => 'Country of residence',
    'message' => 'Message',
];

$body = "New tour enquiry from www.ssniasia.com\n";
$body .= str_repeat('-', 44) . "\n\n";
foreach ($labels as $name => $label) {
    if ($data[$name] === '') {
        continue;
    }
    $value = $data[$name];
    $body .= str_contains($value, "\n")
        ? "$label:\n$value\n\n"
        : "$label: $value\n";
}
$body .= "\nSubmitted: " . gmdate('Y-m-d H:i') . " UTC\n";

/* Modern PHP already collapses CRLF in the subject, but don't rely on the
   host's PHP version for that — strip it here too. */
$subject = 'Tour enquiry: ' . header_safe($data['fullName'])
    . ($data['country'] !== '' ? ' (' . header_safe($data['country']) . ')' : '');
$subject = '=?UTF-8?B?' . base64_encode(mb_substr($subject, 0, 150)) . '?=';

$headers = [
    'From: SSNI Asia Website <' . MAIL_FROM . '>',
    'Reply-To: ' . header_safe($data['email']),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];

$sent = @mail(MAIL_TO, $subject, $body, implode("\r\n", $headers), '-f' . MAIL_FROM);

if ($sent) {
    respond(true, 'Thank you! Your tour enquiry has been sent. We will be in touch soon.');
}

respond(
    false,
    'Your enquiry could not be sent right now. Please try again later, email us at ' . MAIL_TO . ' or call ' . PHONE . '.',
    500
);
