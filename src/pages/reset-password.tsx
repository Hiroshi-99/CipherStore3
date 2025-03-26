import { PasswordResetHandler } from '../components/AuthModal';

export default function ResetPasswordPage() {
  return (
    <div>
      <h1>Reset Your Password</h1>
      <p>Please wait while we process your password reset request...</p>
      <PasswordResetHandler />
    </div>
  );
} 