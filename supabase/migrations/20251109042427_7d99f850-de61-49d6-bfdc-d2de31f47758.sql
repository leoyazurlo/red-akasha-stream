-- Función para otorgar un badge a un usuario si no lo tiene
CREATE OR REPLACE FUNCTION award_badge_if_eligible(
  p_user_id uuid,
  p_badge_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge_id uuid;
BEGIN
  -- Obtener el ID del badge
  SELECT id INTO v_badge_id
  FROM forum_badges
  WHERE name = p_badge_name;
  
  -- Si el badge existe y el usuario no lo tiene, otorgarlo
  IF v_badge_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM user_badges
    WHERE user_id = p_user_id AND badge_id = v_badge_id
  ) THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge_id);
  END IF;
END;
$$;

-- Función para verificar y otorgar badges después de crear un hilo
CREATE OR REPLACE FUNCTION check_thread_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread_count integer;
  v_is_first_in_subforo boolean;
BEGIN
  -- Badge: Primer Hilo
  SELECT COUNT(*) INTO v_thread_count
  FROM forum_threads
  WHERE author_id = NEW.author_id;
  
  IF v_thread_count = 1 THEN
    PERFORM award_badge_if_eligible(NEW.author_id, 'Primer Hilo');
  END IF;
  
  -- Badge: Conversador (10 hilos)
  IF v_thread_count = 10 THEN
    PERFORM award_badge_if_eligible(NEW.author_id, 'Conversador');
  END IF;
  
  -- Badge: Experto del Foro (50 hilos)
  IF v_thread_count = 50 THEN
    PERFORM award_badge_if_eligible(NEW.author_id, 'Experto del Foro');
  END IF;
  
  -- Badge: Primera Sangre (primer hilo en subforo)
  SELECT NOT EXISTS (
    SELECT 1 FROM forum_threads
    WHERE subforo_id = NEW.subforo_id
    AND id != NEW.id
  ) INTO v_is_first_in_subforo;
  
  IF v_is_first_in_subforo THEN
    PERFORM award_badge_if_eligible(NEW.author_id, 'Primera Sangre');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Función para verificar y otorgar badges después de crear un post
CREATE OR REPLACE FUNCTION check_post_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_count integer;
BEGIN
  -- Contar posts del usuario
  SELECT COUNT(*) INTO v_post_count
  FROM forum_posts
  WHERE author_id = NEW.author_id;
  
  -- Badge: Primer Post
  IF v_post_count = 1 THEN
    PERFORM award_badge_if_eligible(NEW.author_id, 'Primer Post');
  END IF;
  
  -- Badge: Colaborador Activo (50 posts)
  IF v_post_count = 50 THEN
    PERFORM award_badge_if_eligible(NEW.author_id, 'Colaborador Activo');
  END IF;
  
  -- Badge: Súper Colaborador (200 posts)
  IF v_post_count = 200 THEN
    PERFORM award_badge_if_eligible(NEW.author_id, 'Súper Colaborador');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Función para verificar badges relacionados con votos
CREATE OR REPLACE FUNCTION check_vote_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_positive_votes integer;
  v_votes_given integer;
  v_author_id uuid;
BEGIN
  -- Obtener el autor del post/thread votado
  IF NEW.post_id IS NOT NULL THEN
    SELECT author_id INTO v_author_id
    FROM forum_posts
    WHERE id = NEW.post_id;
  ELSIF NEW.thread_id IS NOT NULL THEN
    SELECT author_id INTO v_author_id
    FROM forum_threads
    WHERE id = NEW.thread_id;
  END IF;
  
  -- Solo para votos positivos
  IF NEW.vote_value > 0 AND v_author_id IS NOT NULL THEN
    -- Contar votos positivos recibidos por el autor
    SELECT COUNT(*) INTO v_positive_votes
    FROM forum_votes v
    LEFT JOIN forum_posts p ON v.post_id = p.id
    LEFT JOIN forum_threads t ON v.thread_id = t.id
    WHERE v.vote_value > 0
    AND (p.author_id = v_author_id OR t.author_id = v_author_id);
    
    -- Badge: Popular (25 votos)
    IF v_positive_votes = 25 THEN
      PERFORM award_badge_if_eligible(v_author_id, 'Popular');
    END IF;
    
    -- Badge: Muy Popular (100 votos)
    IF v_positive_votes = 100 THEN
      PERFORM award_badge_if_eligible(v_author_id, 'Muy Popular');
    END IF;
  END IF;
  
  -- Badge: Constructivo (ha votado 100 veces)
  SELECT COUNT(*) INTO v_votes_given
  FROM forum_votes
  WHERE user_id = NEW.user_id;
  
  IF v_votes_given = 100 THEN
    PERFORM award_badge_if_eligible(NEW.user_id, 'Constructivo');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Función para verificar badge de mejor respuesta
CREATE OR REPLACE FUNCTION check_best_answer_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_best_answers integer;
BEGIN
  IF NEW.is_best_answer = true AND (OLD.is_best_answer IS NULL OR OLD.is_best_answer = false) THEN
    -- Contar cuántas mejores respuestas tiene el autor
    SELECT COUNT(*) INTO v_best_answers
    FROM forum_posts
    WHERE author_id = NEW.author_id
    AND is_best_answer = true;
    
    -- Badge: Mentor (10 mejores respuestas)
    IF v_best_answers = 10 THEN
      PERFORM award_badge_if_eligible(NEW.author_id, 'Mentor');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear triggers
DROP TRIGGER IF EXISTS trigger_check_thread_badges ON forum_threads;
CREATE TRIGGER trigger_check_thread_badges
  AFTER INSERT ON forum_threads
  FOR EACH ROW
  EXECUTE FUNCTION check_thread_badges();

DROP TRIGGER IF EXISTS trigger_check_post_badges ON forum_posts;
CREATE TRIGGER trigger_check_post_badges
  AFTER INSERT ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION check_post_badges();

DROP TRIGGER IF EXISTS trigger_check_vote_badges ON forum_votes;
CREATE TRIGGER trigger_check_vote_badges
  AFTER INSERT ON forum_votes
  FOR EACH ROW
  EXECUTE FUNCTION check_vote_badges();

DROP TRIGGER IF EXISTS trigger_check_best_answer_badge ON forum_posts;
CREATE TRIGGER trigger_check_best_answer_badge
  AFTER UPDATE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION check_best_answer_badge();