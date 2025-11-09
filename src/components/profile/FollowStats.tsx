import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface FollowStatsProps {
  followersCount: number;
  followingCount: number;
}

export const FollowStats = ({ followersCount, followingCount }: FollowStatsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-4 text-center bg-card border-border hover:bg-accent/50 transition-colors">
        <div className="flex flex-col items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <p className="text-2xl font-bold text-foreground">{followersCount}</p>
            <p className="text-sm text-muted-foreground">Seguidores</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 text-center bg-card border-border hover:bg-accent/50 transition-colors">
        <div className="flex flex-col items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <p className="text-2xl font-bold text-foreground">{followingCount}</p>
            <p className="text-sm text-muted-foreground">Siguiendo</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
