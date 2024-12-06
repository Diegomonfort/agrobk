require('dotenv').config(); 
const express = require('express'); 
const { createClient } = require('@supabase/supabase-js');
const app = express(); 
const jwt = require('jsonwebtoken');
const cors = require('cors');


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

  app.use(cors({
    origin: 'https://agrojardin.vercel.app/' // https://agrojardin.vercel.app/ http://localhost:5173
  }));

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
app.post('/products', authenticateToken, async (req, res) => {
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
  app.patch('/products/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, price, description } = req.body;
  
    try {
      const { data, error } = await supabase
        .from('productos')
        .update({ name, price, description })
        .eq('id', id);
  
      if (error) {
        throw error;
      }
  
      res.status(200).json(data);
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
  
  















// Puerto donde correrá el servidor
const PORT = process.env.PORT || 3000;


// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});