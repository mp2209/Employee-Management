const DATE_FORMAT = { day: '2-digit', month: 'short', year: 'numeric' };

/** Parses "yyyy-MM-dd" (as a local date) or "yyyy-MM-dd HH:mm:ss" / ISO strings. */
export const parseDate = (value) => {
    if (!value) return null;
    const text = String(value);
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    const date = dateOnly
        ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
        : new Date(text.replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? null : date;
};

/** "2030-01-02 00:00:00" -> "02 Jan 2030" */
export const formatDate = (value) => {
    const date = parseDate(value);
    return date ? date.toLocaleDateString('en-GB', DATE_FORMAT) : '—';
};

/** "08:30:00" or "2030-01-02 08:30:00" -> "08:30" */
export const formatTime = (value) => {
    if (!value) return '—';
    const match = /(\d{2}:\d{2})(:\d{2})?$/.exec(String(value));
    return match ? match[1] : String(value);
};

const pad = (value) => String(value).padStart(2, '0');

/** Date as "yyyy-MM-dd", the format timesheet corrections use. */
export const toApiDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Date as "yyyy-MM-dd HH:mm:ss", the format requests and attendance use. */
export const toApiDateTime = (date) =>
    `${toApiDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

/** Today at 00:00 local time. */
export const startOfToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

/** Date as "dd/MM/yyyy", the format profiles store birth dates in. */
export const toDayMonthYear = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
};

/** Parses a "dd/MM/yyyy" birth date. */
export const fromDayMonthYear = (value) => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value || '');
    return match ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])) : null;
};

/** Initials for an avatar: "Binh Tran" -> "BT". */
export const initials = (name) =>
    (name || '?')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
