import moment from 'moment';

export const normalizeReminderDate = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const parsedDate = moment(
    trimmedValue,
    [
      'YYYY-MM-DD',
      'YYYY-MM-DDTHH:mm:ss.SSSZ',
      'YYYY-MM-DDTHH:mm:ss',
      moment.ISO_8601,
      'x',
    ],
    true,
  );

  if (!parsedDate.isValid()) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return parsedDate.startOf('day').toDate();
  }

  return parsedDate.toDate();
};
