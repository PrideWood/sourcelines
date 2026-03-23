import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">标签：{slug}</h1>
        <p className="text-muted-foreground">支持父子层级标签，便于长期扩展知识分类。</p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Badge>parent: thought</Badge>
            <Badge>child: philosophy</Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">MVP 占位：后续接入标签树与引文聚合查询。</p>
        </CardContent>
      </Card>
    </div>
  );
}
