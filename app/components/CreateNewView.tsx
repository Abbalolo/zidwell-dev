"use client";
import { Plus, FileText, Upload } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ContractTemplateCard } from "./ContractsTemplates";
import { contractTemplates } from "./ContractGen";
import { useRouter } from "next/navigation";

interface CreateNewViewProps {
  onUseTemplate: (templateId: string) => void;
}

export const CreateNewView = ({ onUseTemplate }: CreateNewViewProps) => {
  const router = useRouter();
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Create New Contract
        </h2>
        <p className="text-muted-foreground">
          Start a new contract from scratch or upload an existing document
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Start from Scratch</CardTitle>
            <CardDescription>
              Create a completely custom contract with our built-in editor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-[#C29307] hover:bg-[#b28a06] text-white"
              onClick={() =>
                router.push("/dashboard/services/simple-agreement/new-contract")
              }
            >
              Create Blank Contract
            </Button>
          </CardContent>
        </Card>

        {/* <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>
              Upload an existing contract document to edit and manage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Upload File
            </Button>
          </CardContent>
        </Card> */}
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Choose a Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractTemplates.map((template) => (
            <ContractTemplateCard
              // key={template.id}
              template={template}
              onUseTemplate={onUseTemplate}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
