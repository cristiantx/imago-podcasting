import { SignIn } from "@clerk/nextjs";

import { Card, CardContent } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <Card>
      <CardContent className="grid place-items-center p-6">
        <SignIn />
      </CardContent>
    </Card>
  );
}
