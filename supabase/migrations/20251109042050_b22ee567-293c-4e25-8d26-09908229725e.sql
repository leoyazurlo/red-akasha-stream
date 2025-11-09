-- Primero, eliminar categorías no deseadas
DELETE FROM forum_categories 
WHERE nombre IN (
  'Tecnología Web 3',
  'Colaboración para el armado de una blockchain colaborativa',
  'Arte y creatividad',
  'Arte visionario',
  'Música y sonido',
  'Escritura creativa'
);

-- Actualizar o insertar On Demand
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM forum_categories WHERE nombre = 'On Demand') THEN
    UPDATE forum_categories 
    SET descripcion = 'En esta sección vas a poder disfrutar de una forma de ver contenido, creemos que se va a poder mejorar la funcionalidad, esperamos tu opinión',
        icono = 'Play',
        orden = 1
    WHERE nombre = 'On Demand';
  ELSE
    INSERT INTO forum_categories (nombre, descripcion, icono, orden)
    VALUES ('On Demand', 'En esta sección vas a poder disfrutar de una forma de ver contenido, creemos que se va a poder mejorar la funcionalidad, esperamos tu opinión', 'Play', 1);
  END IF;
END $$;

-- Actualizar o insertar Artistas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM forum_categories WHERE nombre = 'Artistas') THEN
    UPDATE forum_categories 
    SET descripcion = 'Tu aporte a esta sección está abierto. En este proyecto tenés la oportunidad de ayudarnos a mejorar la funcionalidad de esta plataforma.',
        icono = 'Music',
        orden = 2
    WHERE nombre = 'Artistas';
  ELSE
    INSERT INTO forum_categories (nombre, descripcion, icono, orden)
    VALUES ('Artistas', 'Tu aporte a esta sección está abierto. En este proyecto tenés la oportunidad de ayudarnos a mejorar la funcionalidad de esta plataforma.', 'Music', 2);
  END IF;
END $$;

-- Actualizar o insertar Circuito
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM forum_categories WHERE nombre = 'Circuito') THEN
    UPDATE forum_categories 
    SET descripcion = 'Pretendemos digitalizar el circuito de producción de tu zona y convertir esta sección en una herramienta que nos ayude a reconocernos a todos los que hacemos producción',
        icono = 'Network',
        orden = 3
    WHERE nombre = 'Circuito';
  ELSE
    INSERT INTO forum_categories (nombre, descripcion, icono, orden)
    VALUES ('Circuito', 'Pretendemos digitalizar el circuito de producción de tu zona y convertir esta sección en una herramienta que nos ayude a reconocernos a todos los que hacemos producción', 'Network', 3);
  END IF;
END $$;

-- Actualizar o insertar Foro
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM forum_categories WHERE nombre = 'Foro') THEN
    UPDATE forum_categories 
    SET descripcion = 'Cómo mejorar la interacción de usuarios en los debates, votaciones de temas para el desarrollo de la plataforma',
        icono = 'MessageSquare',
        orden = 4
    WHERE nombre = 'Foro';
  ELSE
    INSERT INTO forum_categories (nombre, descripcion, icono, orden)
    VALUES ('Foro', 'Cómo mejorar la interacción de usuarios en los debates, votaciones de temas para el desarrollo de la plataforma', 'MessageSquare', 4);
  END IF;
END $$;

-- Actualizar o insertar Nuevas tecnologías
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM forum_categories WHERE nombre = 'Nuevas tecnologías') THEN
    UPDATE forum_categories 
    SET descripcion = 'Creemos que Red Akasha tiene que ser una plataforma basada en tecnología blockchain, que se acerquen personas vinculadas al rubro tecnológico para convertir este proyecto en una red blockchain que democratice el valor artístico.',
        icono = 'Cpu',
        orden = 5
    WHERE nombre = 'Nuevas tecnologías';
  ELSE
    INSERT INTO forum_categories (nombre, descripcion, icono, orden)
    VALUES ('Nuevas tecnologías', 'Creemos que Red Akasha tiene que ser una plataforma basada en tecnología blockchain, que se acerquen personas vinculadas al rubro tecnológico para convertir este proyecto en una red blockchain que democratice el valor artístico.', 'Cpu', 5);
  END IF;
END $$;