import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Building2, DollarSign, Award, BookOpen } from "lucide-react"

interface PublisherCardProps {
  name: string
  description: string
  totalProjects: number
  totalFundsRaised: number
  trustScore: number
  yearFounded: number
}

export function PublisherCard({
  name,
  description,
  totalProjects,
  totalFundsRaised,
  trustScore,
  yearFounded,
}: PublisherCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="w-5 h-5" />
          <span>{name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-blue-500" />
          <span className="text-sm">{totalProjects} projects</span>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-green-500" />
          <span className="text-sm">${totalFundsRaised.toLocaleString()} raised in total</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Trust Score</span>
            <Badge variant="outline">{trustScore}%</Badge>
          </div>
          <Progress value={trustScore} className="h-2" />
        </div>
        <div className="flex items-center space-x-2">
          <Award className="w-4 h-4 text-yellow-500" />
          <span className="text-sm">Founded in {yearFounded}</span>
        </div>
      </CardContent>
    </Card>
  )
}

