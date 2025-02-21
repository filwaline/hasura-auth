import { castObjectEnv } from '@config';
import { logger } from './logger';
import { ENV } from './utils';

function isUnset(val?: string) {
  return (
    typeof val === 'undefined' || (typeof val === 'string' && val.length === 0)
  );
}

const errors: string[] = [];
const warnings: string[] = [];

if (process.env.AUTH_USER_SESSION_VARIABLE_FIELDS) {
  // TODO: check environment variable format on startup
  warnings.push(
    `The 'AUTH_USER_SESSION_VARIABLE_FIELDS' environment variable is deprecated. Use 'AUTH_JWT_CUSTOM_CLAIMS' instead`
  );
}

if (process.env.AUTH_JWT_CUSTOM_CLAIMS) {
  try {
    castObjectEnv<Record<string, string>>('AUTH_JWT_CUSTOM_CLAIMS');
  } catch {
    warnings.push(
      `Impossible to parse 'AUTH_JWT_CUSTOM_CLAIMS'. It will therefore be deactivated`
    );
  }
}

[
  'HASURA_GRAPHQL_JWT_SECRET',
  'HASURA_GRAPHQL_GRAPHQL_URL',
  'HASURA_GRAPHQL_ADMIN_SECRET',
  'HASURA_GRAPHQL_DATABASE_URL',
].forEach((env) => {
  if (isUnset(process.env[env])) {
    errors.push(`No value was provided for required env var ${env}`);
  }
});

if (process.env.AUTH_EMAIL_TEMPLATE_FETCH_URL) {
  warnings.push(
    `The 'AUTH_EMAIL_TEMPLATE_FETCH_URL' environment variable is deprecated, and the feature will be deactivated soon. Please include your templates in the file system instead.`
  );
}

if (ENV.AUTH_SMS_PROVIDER) {
  if (ENV.AUTH_SMS_PROVIDER === 'twilio') {
    [
      'AUTH_SMS_TWILIO_ACCOUNT_SID',
      'AUTH_SMS_TWILIO_AUTH_TOKEN',
      'AUTH_SMS_TWILIO_MESSAGING_SERVICE_ID',
    ].forEach((env) => {
      if (isUnset(process.env[env])) {
        errors.push(
          `Env var ${env} is required when the Twilio is set as SMS provider, but no value was provided`
        );
      }
    });
  }
  else if (ENV.AUTH_SMS_PROVIDER === 'alicloud') {
    [
      'AUTH_SMS_ALICLOUD_ACCESS_KEY_ID',
      'AUTH_SMS_ALICLOUD_ACCESS_KEY_SECRET',
      'AUTH_SMS_ALICLOUD_ENDPOINT',
      'AUTH_SMS_ALICLOUD_TEMPLATE_CODE_DEFAULT',
      'AUTH_SMS_ALICLOUD_SIGN_NAME_DEFAULT',
    ].forEach((env) => {
      if (isUnset(process.env[env])) {
        errors.push(
          `Env var ${env} is required when the Alicloud is set as SMS provider, but no value was provided`
        );
      }
    });
  }
}
else {
  errors.push(
    `Incorrect SMS provider - AUTH_SMS_PROVIDER of value '${ENV.AUTH_SMS_PROVIDER}' is not one of the supported. Supported providers are: 'twilio', 'alicloud'`
  );
}

if (ENV.AUTH_WEBAUTHN_ENABLED) {
  if (isUnset(ENV.AUTH_CLIENT_URL)) {
    errors.push(
      `Env var AUTH_CLIENT_URL is required when the Webauthn is enabled, but no value was provided`
    );
  }
  if (isUnset(ENV.AUTH_WEBAUTHN_RP_NAME)) {
    errors.push(
      `Env var AUTH_WEBAUTHN_RP_NAME is required when the Webauthn is enabled, but no value was provided`
    );
  }
  if (
    isUnset(process.env['AUTH_WEBAUTHN_RP_ORIGINS']) &&
    isUnset(process.env['AUTH_CLIENT_URL'])
  ) {
    errors.push(
      `Webauthn requires at least on of the following to be set: 'AUTH_WEBAUTHN_RP_ORIGINS', 'AUTH_CLIENT_URL'`
    );
  }
}

if (errors.length) {
  logger.error(errors.join('\n'));
  throw new Error('Invalid configuration');
}

warnings.forEach((warn) => logger.warn(warn));
