require('dotenv').config(); 
const express = require('express'); 
const { createClient } = require('@supabase/supabase-js');
const app = express(); 
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const upload = multer();

app.use(express.json());


const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
  
    if (!token) {
      return res.status(403).json({ error: 'Token no proporcionado' });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Token no válido' });
      }

      req.user = user;
      next();
    });
  };

  const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = ['https://agrojardin.vercel.app', 'http://localhost:5173'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

/* GET DE PRODUCTOS
   DEVUELVE TODOS LOS PRODUCTOS  */

app.get('/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos') 
      .select('*');

    if (error) {
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ error: 'Error al obtener los productos.' });
  }
});


/* GET DE UN PRODUCTO POR ID 
   DEVUELVE UN PRODUCTO ESPECÍFICO */

   app.get('/products/:id', async (req, res) => {
    const { id } = req.params;  // Obtener el id del parámetro de la URL
  
    try {
      const { data, error } = await supabase
        .from('productos')  // Tabla de productos
        .select('*')        // Seleccionar todos los campos
        .eq('id', id)       // Filtrar por el ID del producto
        .single();          // Obtener solo un producto
  
      if (error) {
        throw error;
      }
  
      res.json(data);  // Devolver el producto encontrado
    } catch (error) {
      console.error('Error al obtener el producto:', error);
      res.status(500).json({ error: 'Error al obtener el producto.' });
    }
  });


/* POST DE PRODUCTOS
   CREA UN PRODUCTO  */
app.post('/products', async (req, res) => {
    const { name, price, description } = req.body;
  
    if (!name || !price) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }
  
    try {
      const { data, error } = await supabase
        .from('productos')
        .insert([{ name, price, description }]);
  
      if (error) {
        throw error;
      }
  
      res.status(201).json(data);
    } catch (error) {
      console.error('Error al crear el producto:', error);
      res.status(500).json({ error: 'Error al crear el producto.' });
    }
  });

/* PATCH DE PRODUCTOS
   ACTUALIZA UN PRODUCTO  */
   app.patch('/products/:id', upload.single('Imagen'), async (req, res) => {
    const { id } = req.params;
    const {
        Producto,
        Marca,
        Modelo,
        Precio,
        Categoria,
        IVA,
        Familia,
        Subseccion,
        Descripcion
    } = req.body;

    const newImage = req.file; // Accede a la imagen cargada

    try {
        const updateData = {
            Producto,
            Marca,
            Modelo,
            Precio,
            Categoria,
            IVA,
            Familia,
            Subseccion,
            Descripcion,
        };

        // Si hay una nueva imagen, maneja su almacenamiento y actualiza el campo en la BD
        if (newImage) {
            // Aquí puedes subir la imagen a Supabase, S3 o almacenarla localmente
            const imagePath = `ruta/donde/guardaste/la/imagen/${newImage.filename}`;
            updateData.Imagen = imagePath;
        }

        // Actualiza la tabla `productos`
        const { data, error } = await supabase
            .from('productos')
            .update(updateData)
            .eq('id', id);

        if (error) {
            throw error;
        }

        res.status(200).json({ message: 'Producto actualizado correctamente', data });
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ error: 'Error al actualizar el producto.' });
    }
});

/* DELETE DE PRODUCTOS
   EMILINA UN PRODUCTO  */
  app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const { data, error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);
  
      if (error) {
        throw error;
      }
  
      res.status(200).json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      res.status(500).json({ error: 'Error al eliminar el producto.' });
    }
  });






/* GET DE PRODUCTOS
   DEVUELVE TODOS LOS PRODUCTOS  */
app.get('/categories', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('categorias') 
        .select('*');
  
      if (error) {
        throw error;
      }
      res.json(data);
    } catch (error) {
      console.error('Error al obtener las categorias:', error);
      res.status(500).json({ error: 'Error al obtener las categorias.' });
    }
  });
  
  
  /* DELETE DE CATEGORIAS
   EMILINA UNA CATEGORIA  */
   app.delete('/categories/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const { data, error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);
  
      if (error) {
        throw error;
      }
  
      res.status(200).json({ message: 'Categoria eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar el categoria:', error);
      res.status(500).json({ error: 'Error al eliminar el categoria.' });
    }
  });















// Puerto donde correrá el servidor
const PORT = process.env.PORT || 3000;


// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});