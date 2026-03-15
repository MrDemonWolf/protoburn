"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Copy, Check, ArrowRight, Flame } from "lucide-react";

export function SetupWizard() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const hasUsersQuery = useQuery(trpc.auth.hasUsers.queryOptions());

  const setupMutation = useMutation({
    mutationFn: async () => {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

      // Step 1: Sign up via Better Auth
      const signupRes = await fetch(`${serverUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!signupRes.ok) {
        const err = await signupRes.text();
        throw new Error(`Signup failed: ${err}`);
      }

      // Step 2: Get API key
      const setupRes = await fetch(`${serverUrl}/trpc/auth.setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!setupRes.ok) {
        throw new Error("Failed to generate API key");
      }

      const data = (await setupRes.json()) as { result: { data: { apiKey: string; prefix: string; keyHash: string } } };
      return data.result.data;
    },
    onSuccess: (data) => {
      setApiKey(data.apiKey);
      localStorage.setItem("protoburn-api-key", data.apiKey);
      setStep(2);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Setup failed");
    },
  });

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If users already exist, redirect
  if (hasUsersQuery.data === true) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Setup already completed.</p>
          <Button className="mt-4" onClick={() => (window.location.href = "/")}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mb-2 flex justify-center">
          <Flame className="text-primary h-10 w-10" />
        </div>
        <CardTitle className="font-heading text-2xl">ProtoBurn Setup</CardTitle>
        <p className="text-muted-foreground text-sm">
          {step === 1 && "Create your admin account"}
          {step === 2 && "Your API key is ready"}
          {step === 3 && "Start syncing"}
        </p>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              setupMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                minLength={8}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={setupMutation.isPending}>
              {setupMutation.isPending ? "Setting up..." : "Create Account"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Save this API key — you won't be able to see it again.
            </p>
            <div className="flex items-center gap-2">
              <code className="bg-muted flex-1 rounded-md px-3 py-2 text-sm break-all">
                {apiKey}
              </code>
              <Button variant="ghost" size="icon" onClick={copyKey}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button className="w-full" onClick={() => setStep(3)}>
              I've saved my key
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Set up the sync script to push your Claude Code usage:
            </p>
            <div className="bg-muted rounded-md p-3">
              <code className="text-xs">
                <span className="text-muted-foreground"># Set your API key</span>
                <br />
                export PROTOBURN_API_KEY="{apiKey.slice(0, 11)}..."
                <br />
                <br />
                <span className="text-muted-foreground"># Run sync</span>
                <br />
                bun sync
                <br />
                <br />
                <span className="text-muted-foreground"># Or watch mode</span>
                <br />
                bun sync:watch
              </code>
            </div>
            <Button className="w-full" onClick={() => (window.location.href = "/")}>
              Go to Dashboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
