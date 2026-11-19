import { useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router';
import { getMe } from '@/api/generated/endpoints/identity/identity';
import { encodeCredentials, saveCredentials } from '@/shared/auth/session';
import { candidateCredentials } from '@/shared/http/mutator';
import { HOME_PATH } from '@/shared/routes/paths';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

function formString(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value : '';
}

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const credentials = encodeCredentials(
      formString(form.get('username')),
      formString(form.get('password')),
    );
    setSubmitting(true);
    setError(null);
    try {
      // Not stored yet: the mutator sends the candidate credentials; keep them only if accepted.
      const response = await getMe(candidateCredentials(credentials));
      const status: number = response.status;
      if (status === 200) {
        saveCredentials(credentials);
        await navigate(HOME_PATH, { replace: true });
      } else if (status === 401) {
        setError('Wrong username or password.');
      } else {
        setError('Something went wrong on the server. Please try again.');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold">ChallengeU</h1>
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
            <label className="flex flex-col gap-1 text-sm">
              Username
              <Input name="username" autoComplete="username" required />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Password
              <Input name="password" type="password" autoComplete="current-password" required />
            </label>
            {error ? (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={submitting}>
              Log in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
