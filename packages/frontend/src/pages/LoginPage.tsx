import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { InkwellWriting, MarginDoodles } from "../components/inkwell";

export function LoginPage() {
  const { login, isAccessDenied } = useAuth();

  useEffect(() => {
    if (!isAccessDenied) {
      login();
    }
  }, [isAccessDenied, login]);

  return (
    <div className="min-h-screen bg-manga-page flex items-center justify-center px-4 relative overflow-hidden">
      <MarginDoodles />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <InkwellWriting className="mx-auto mb-2" width={120} height={132} />
          <h1 className="font-display text-3xl text-warm-800 tracking-wider uppercase">
            Welcome to Writing Buddy!
          </h1>
          <p className="text-warm-500 mt-2 text-base">
            Sign in with your 11+ Hub account to start writing
          </p>
        </div>

        <div className="bg-white rounded-[16px] border-3 border-ink shadow-[6px_6px_0_var(--color-ink)] p-6 space-y-5">
          {isAccessDenied ? (
            <>
              <div className="bg-amber-50 border-2 border-ink rounded-[10px] p-4 text-center">
                <p className="text-amber-800 text-sm font-medium">
                  Your current plan does not include access to Writing Buddy.
                </p>
                <p className="text-amber-600 text-xs mt-1">
                  Please upgrade your subscription on the 11+ Hub to get
                  access.
                </p>
              </div>
              <button
                type="button"
                onClick={login}
                className="btn-manga w-full bg-sky text-white text-base flex items-center justify-center gap-2 px-4 h-12"
              >
                Try again
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-8 h-8 border-3 border-sky border-t-transparent rounded-full animate-spin" />
                <p className="text-warm-500 text-sm">
                  Redirecting to 11+ Hub...
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
