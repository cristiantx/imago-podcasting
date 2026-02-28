import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="panel" style={{ padding: 24, display: "grid", placeItems: "center" }}>
      <SignIn />
    </div>
  );
}
