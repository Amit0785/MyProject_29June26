import * as Yup from 'yup';

//const americanPhoneRegex = /^(\+1\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Example regex for email validation
const nameRegex = /^[A-Za-z\s]+$/; // Allows only alphabets and spaces
const phoneRegex = /^\d+$/;
// const passwordRegex =
//   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/;

// Name validation (Only letters & spaces, no numbers or special characters)
export const nameValidation = Yup.string()
  .test('no-empty-spaces', 'Name cannot contain only spaces', value =>
    typeof value === 'string' ? value.trim().length > 0 : false,
  )
  .matches(nameRegex, 'Name must contain only letters.') // Restricts numbers & special characters
  .min(4, 'Name must be at least 4 characters')
  .required('Name is required');

// Email validation

export const emailValidation = Yup.string()
  .test('no-empty-spaces', 'Email cannot contain only spaces', value =>
    typeof value === 'string' ? value.trim().length > 0 : false,
  )
  .email('Invalid email address')
  .matches(emailRegex, 'Invalid email address')
  .required('Email is required');

// Password validation (Strong password)

// export const passwordValidation = Yup.string()
//   .test(
//     'no-empty-spaces',
//     'Password cannot be empty or contain only spaces',
//     value => (typeof value === 'string' ? value.trim().length > 0 : false),
//   )
//   .matches(
//     passwordRegex,
//     'Password must have at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
//   )
//   .min(6, 'Password must be at least 6 characters')
//   .required('Password is required');

export const passwordValidation = Yup.string()
  .test('no-empty-spaces', 'Password cannot contain only spaces', value =>
    typeof value === 'string' ? value.trim().length > 0 : false,
  )
  .test('uppercase', 'Password must have at least 1 uppercase letter', value =>
    /[A-Z]/.test(value || ''),
  )
  .test('lowercase', 'Password must have at least 1 lowercase letter', value =>
    /[a-z]/.test(value || ''),
  )
  .test('number', 'Password must have at least 1 number', value =>
    /\d/.test(value || ''),
  )
  .test(
    'special-character',
    'Password must have at least 1 special character',
    value => /[!@#$%^&*(),.?":{}|<>]/.test(value || ''),
  )
  .min(8, ({ label }) => `${label} must be at least 8 characters`)
  .required(({ label }) => `${label} is required`);

export const confirmPasswordValidation = (
  passwordFieldName: string = 'password',
  label: string = 'Confirm Password',
) => {
  return Yup.string()
    .test(
      'no-empty-spaces',
      'Confirm Password cannot contain only spaces',
      value => (typeof value === 'string' ? value.trim().length > 0 : false),
    )
    .test(
      'uppercase',
      'Confirm Password must have at least 1 uppercase letter',
      value => /[A-Z]/.test(value || ''),
    )
    .test(
      'lowercase',
      'Confirm Password must have at least 1 lowercase letter',
      value => /[a-z]/.test(value || ''),
    )
    .test('number', 'Confirm Password must have at least 1 number', value =>
      /\d/.test(value || ''),
    )
    .test(
      'special-character',
      'Confirm Password must have at least 1 special character',
      value => /[!@#$%^&*(),.?":{}|<>]/.test(value || ''),
    )
    .min(8, `${label} must be at least 8 characters`)
    .oneOf([Yup.ref(passwordFieldName)], 'Password mismatch') // Now dynamic
    .required(`${label} is required`);
};

export const termsCheckedValidation = Yup.boolean()
  .oneOf([true], 'Please accept Terms & Conditions')
  .required('Please accept Terms & Conditions');

export const otpValidation = Yup.string()
  .matches(/^\d{4}$/, 'OTP must be exactly 4 digits') // Ensures 4 numeric digits
  .required('OTP is required');

export const phoneValidation = Yup.string()
  .min(10, 'Phone number must at least 10 charcter long')
  .matches(phoneRegex, 'Invalid Phone Number')
  .required('Phone number is required');

export const genderValidation = Yup.string()
  .oneOf(['Male', 'Female', 'Other'], 'Invalid gender selection')
  .required('Gender is required');

export const cityValidation = Yup.string().required('City is required');

export const stringRequiredValidation = Yup.string()
  // ${label} will automatically inject whatever you pass into .label()
  .required(({ label }) => `${label} is required`);

export const reasonValidation = Yup.string().when('selectedOption', {
  is: (val: string) => val === 'other',
  then: () =>
    Yup.string()
      .test('no-empty-spaces', 'Reason cannot contain only spaces', value =>
        typeof value === 'string' ? value.trim().length > 0 : false,
      )
      .required('Reason is required'),
  otherwise: () => Yup.string(),
});

export const aboutValidation = Yup.string().required('About is required');
