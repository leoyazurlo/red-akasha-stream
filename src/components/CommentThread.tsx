import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Reply, Send, Loader2, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface CommentData {
  id: string;
  content_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  parent_comment_id: string | null;
  edited_at: string | null;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  replies?: CommentData[];
}

interface CommentThreadProps {
  comment: CommentData;
  currentUserId: string | null;
  onDelete: (commentId: string) => void;
  contentId: string;
  depth?: number;
}

export const CommentThread = ({ 
  comment, 
  currentUserId, 
  onDelete, 
  contentId,
  depth = 0 
}: CommentThreadProps) => {
  const navigate = useNavigate();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment);
  const [saving, setSaving] = useState(false);
  
  const handleReply = async () => {
    if (!currentUserId) {
      navigate('/auth');
      return;
    }

    if (!replyText.trim()) return;

    setPosting(true);
    try {
      const { error } = await supabase
        .from('content_comments')
        .insert({
          content_id: contentId,
          user_id: currentUserId,
          comment: replyText.trim(),
          parent_comment_id: comment.id
        });
      
      if (error) throw error;
      
      setReplyText("");
      setShowReplyForm(false);
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setPosting(false);
    }
  };

  const handleEdit = async () => {
    if (!editText.trim() || editText === comment.comment) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('content_comments')
        .update({
          comment: editText.trim(),
          edited_at: new Date().toISOString()
        })
        .eq('id', comment.id);
      
      if (error) throw error;
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing comment:', error);
    } finally {
      setSaving(false);
    }
  };

  const maxDepth = 3;
  const canReply = depth < maxDepth;

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-3' : ''}`}>
      <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback>
            {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {comment.profiles?.username || 'Usuario'}
              </span>
              {comment.edited_at && (
                <span className="text-xs text-muted-foreground italic">
                  (editado)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {new Date(comment.edited_at || comment.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {currentUserId && currentUserId === comment.user_id && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setIsEditing(true);
                      setEditText(comment.comment);
                    }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onDelete(comment.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="resize-none text-sm"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={!editText.trim() || saving || editText === comment.comment}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3 mr-1" />
                      Guardar
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(comment.comment);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {comment.comment}
            </p>
          )}
          
          {canReply && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 mt-2 text-xs"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              <Reply className="w-3 h-3 mr-1" />
              Responder
            </Button>
          )}

          {showReplyForm && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Escribe tu respuesta..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="resize-none text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyText.trim() || posting}
                >
                  {posting ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3 mr-1" />
                      Enviar
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyText("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Respuestas anidadas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onDelete={onDelete}
              contentId={contentId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
