import { FileText } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ContractTemplateType } from "./ContractGen";
import Loader from "./Loader";

interface ContractTemplateCardProps {
  template: ContractTemplateType;
  onUseTemplate: (templateId: string) => void;

}



export const ContractTemplateCard = ({
  template,
  onUseTemplate,
 
}: ContractTemplateCardProps) => {

  return (
    <Card className="h-full flex flex-col transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex-1">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground mb-2">
              {template.title}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              {template.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          className="w-full bg-[#C29307] hover:bg-[#b28a06] text-white"
          onClick={() => onUseTemplate(template.id)}
        >
          Use Template
        </Button>
      </CardContent>
    </Card>
  );
};
