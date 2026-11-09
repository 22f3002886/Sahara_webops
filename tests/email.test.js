import { test } from 'node:test';
import assert from 'node:assert/strict';
import { smtpConfiguration } from '../lib/email.js';
test('SMTP configuration requires complete credentials and encrypted transport', () => {
  assert.equal(smtpConfiguration({}), null);
  assert.throws(() => smtpConfiguration({ SMTP_HOST: 'example.com' }));
  const config = {
    SMTP_HOST: 'smtp.example.com',
    SMTP_USER: 'tester',
    SMTP_PASS: 'synthetic-only',
    SMTP_FROM: 'verified@example.com',
  };
  assert.equal(smtpConfiguration(config).options.requireTLS, true);
  assert.equal(smtpConfiguration({ ...config, SMTP_PORT: '465' }).options.secure, true);
  assert.throws(() => smtpConfiguration({ ...config, SMTP_PORT: '25' }));
  assert.throws(() =>
    smtpConfiguration({ ...config, SMTP_FROM: 'invalid\r\nBcc:other@example.com' }),
  );
});
