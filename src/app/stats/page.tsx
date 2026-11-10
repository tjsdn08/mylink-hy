"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowLeft, ChartNoAxesColumn, MousePointerClick } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getFirebaseAuth, getFirebaseFirestore } from "@/lib/firebase";

type Status = "loading" | "ready" | "redirecting" | "error";

type LinkStats = {
  id: string;
  title: string;
  clickCount: number;
};

const chartConfig = {
  clickCount: {
    label: "클릭 수",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function formatCount(count: number): string {
  return count.toLocaleString("ko-KR");
}

export default function StatsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [links, setLinks] = useState<LinkStats[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    let unsubscribeLinks: (() => void) | undefined;
    let unsubscribeAuth: (() => void) | undefined;

    void Promise.resolve()
      .then(() => {
        if (disposed) return;
        unsubscribeAuth = onAuthStateChanged(
          getFirebaseAuth(),
          (user) => {
            unsubscribeLinks?.();
            unsubscribeLinks = undefined;
            setLinks([]);
            setError("");
            if (!user) {
              setStatus("redirecting");
              router.replace("/");
              return;
            }

            setStatus("loading");
            const currentUid = user.uid;
            const linksQuery = query(
              collection(getFirebaseFirestore(), "users", currentUid, "links"),
              orderBy("createdAt", "desc")
            );
            unsubscribeLinks = onSnapshot(
              linksQuery,
              (snapshot) => {
                if (disposed || getFirebaseAuth().currentUser?.uid !== currentUid) return;
                setLinks(
                  snapshot.docs.map((linkDoc) => {
                    const data = linkDoc.data();
                    const value = data.clickCount;
                    return {
                      id: linkDoc.id,
                      title: typeof data.title === "string" ? data.title : "제목 없는 링크",
                      clickCount:
                        typeof value === "number" && Number.isFinite(value) && value >= 0
                          ? value
                          : 0,
                    };
                  })
                );
                setStatus("ready");
              },
              (snapshotError) => {
                if (disposed) return;
                setError(`클릭 통계를 불러오지 못했어요: ${snapshotError.message}`);
                setStatus("error");
              }
            );
          },
          (authError) => {
            if (disposed) return;
            setError(`로그인 상태를 확인하지 못했어요: ${authError.message}`);
            setStatus("error");
          }
        );
      })
      .catch((cause: unknown) => {
        if (disposed) return;
        setError(
          cause instanceof Error
            ? `Firebase를 초기화하지 못했어요: ${cause.message}`
            : "Firebase를 초기화하지 못했어요."
        );
        setStatus("error");
      });

    return () => {
      disposed = true;
      unsubscribeLinks?.();
      unsubscribeAuth?.();
    };
  }, [router]);

  const totalClicks = useMemo(
    () => links.reduce((sum, link) => sum + link.clickCount, 0),
    [links]
  );
  const sortedLinks = useMemo(
    () => [...links].sort((a, b) => b.clickCount - a.clickCount || a.title.localeCompare(b.title)),
    [links]
  );
  const chartData = useMemo(
    () => sortedLinks.slice(0, 10).map((link) => ({ ...link, label: link.title.length > 12 ? `${link.title.slice(0, 12)}…` : link.title })),
    [sortedLinks]
  );

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-h1 text-foreground">클릭 통계</h1>
          <p className="text-body-2 text-muted-foreground">내 링크의 클릭 수를 확인해요.</p>
        </div>
        <Button variant="outline" render={<NextLink href="/" />}>
          <ArrowLeft aria-hidden="true" /> 마이페이지
        </Button>
      </header>

      {status === "loading" || status === "redirecting" ? (
        <p role="status" className="text-body-2 text-muted-foreground">
          {status === "redirecting" ? "로그인 화면으로 이동하고 있어요." : "클릭 통계를 불러오고 있어요."}
        </p>
      ) : null}
      {status === "error" ? (
        <p role="alert" className="rounded-2xl border border-destructive/30 bg-card p-5 text-sm text-destructive">{error}</p>
      ) : null}

      {status === "ready" ? (
        <>
          <Card className="rounded-3xl border-border/70 bg-card shadow-tds-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-title-2">
                <MousePointerClick aria-hidden="true" className="size-5 text-primary" />
                총 클릭 수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-display-2 font-bold tabular-nums text-foreground">
                {formatCount(totalClicks)} <span className="text-body-2 font-normal text-muted-foreground">회</span>
              </p>
              <p className="mt-1 text-caption text-muted-foreground">내 링크 {links.length}개 합계</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 bg-card shadow-tds-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-title-2">
                <ChartNoAxesColumn aria-hidden="true" className="size-5 text-primary" />
                링크별 클릭 수
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {sortedLinks.length === 0 ? (
                <p className="py-8 text-center text-body-2 text-muted-foreground">등록한 링크가 없어요.</p>
              ) : (
                <>
                  <ChartContainer
                    config={chartConfig}
                    className="min-h-[220px] w-full aspect-auto"
                    style={{ height: Math.max(220, chartData.length * 48) }}
                  >
                    <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 0, right: 12 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} domain={[0, "dataMax"]} tickLine={false} axisLine={false} />
                      <YAxis dataKey="label" type="category" width={100} tickLine={false} axisLine={false} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                      <Bar dataKey="clickCount" fill="var(--color-clickCount)" radius={4} maxBarSize={22} />
                    </BarChart>
                  </ChartContainer>
                  <div className="divide-y divide-border" aria-label="모든 링크별 클릭 수">
                    {sortedLinks.map((link) => (
                      <div key={link.id} className="flex items-center justify-between gap-4 py-3 text-body-2">
                        <span className="min-w-0 truncate text-foreground" title={link.title}>{link.title}</span>
                        <span className="shrink-0 font-medium tabular-nums text-foreground">{formatCount(link.clickCount)}회</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </main>
  );
}
