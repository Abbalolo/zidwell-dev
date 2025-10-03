export default function KPICard({ title, value }: { title: string; value: number | string }) {
return (
<div className="p-4 border rounded">
<div className="text-sm text-gray-500">{title}</div>
<div className="mt-2 text-2xl font-bold">{value}</div>
</div>
)
}