import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck } from 'lucide-react';
import { useFollow } from '@/hooks/useFollow';

interface FollowButtonProps {
  userId: string;
  currentUserId: string | undefined;
}

export const FollowButton = ({ userId, currentUserId }: FollowButtonProps) => {
  const { isFollowing, isLoading, toggleFollow } = useFollow(userId);

  if (!currentUserId || currentUserId === userId) {
    return null;
  }

  return (
    <Button
      onClick={toggleFollow}
      disabled={isLoading}
      variant={isFollowing ? 'secondary' : 'default'}
      className="gap-2"
    >
      {isFollowing ? (
        <>
          <UserCheck className="h-4 w-4" />
          Siguiendo
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Seguir
        </>
      )}
    </Button>
  );
};
