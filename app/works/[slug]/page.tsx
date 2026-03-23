import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">作品：{slug}</h1>
        <p className="text-muted-foreground">展示该作品下的结构化引文条目。</p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <Badge>work archive</Badge>
          <p className="mt-3 text-sm text-muted-foreground">MVP 占位：后续接入 Prisma 查询并按作品聚合展示。</p>
        </CardContent>
      </Card>
    </div>
  );
}
