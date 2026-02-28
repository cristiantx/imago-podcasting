import { SignUp } from "@clerk/nextjs";

import { Card, CardContent } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <Card>
      <CardContent className="grid place-items-center p-6">
        <SignUp />
      </CardContent>
    </Card>
  );
}
