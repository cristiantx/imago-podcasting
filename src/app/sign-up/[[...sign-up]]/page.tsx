import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="panel" style={{ padding: 24, display: "grid", placeItems: "center" }}>
      <SignUp />
    </div>
  );
}
