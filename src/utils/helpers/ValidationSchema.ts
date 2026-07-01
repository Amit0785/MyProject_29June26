import * as Yup from 'yup';

//const americanPhoneRegex = /^(\+1\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Example regex for email validation

// Email validation

export const emailValidation = Yup.string()
  .test('no-empty-spaces', 'Email cannot contain only spaces', value =>
    typeof value === 'string' ? value.trim().length > 0 : false,
  )
  .email('Invalid email address')
  .matches(emailRegex, 'Invalid email address')
  .required('Email is required');

export const stringRequiredValidation = Yup.string()
  // ${label} will automatically inject whatever you pass into .label()
  .required(({ label }) => `${label} is required`);

export const taskValidationSchema = Yup.object().shape({
  title: Yup.string().trim().required('Task Title is mandatory.'),
  description: Yup.string().nullable(),
  category: Yup.string()
    .oneOf(['work', 'personal', 'health', 'shopping', 'other'])
    .required(),
  priority: Yup.string().oneOf(['low', 'medium', 'high']).required(),
  dueDate: Yup.string()
    .nullable()
    .test(
      'is-date',
      'Due date must be in YYYY-MM-DD or YYYY-MM-DD HH:mm format',
      value => {
        if (!value) return true;

        const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
        const dateTimeRegex = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/;

        return (
          (dateOnlyRegex.test(value) || dateTimeRegex.test(value)) &&
          !isNaN(Date.parse(value.replace(' ', 'T')))
        );
      },
    ),
  enableReminder: Yup.boolean().optional(),
});
