require('dotenv').config(); 
const fs = require('fs');
const path = require('path');
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









  const storage = multer.memoryStorage();
  
  app.patch('/products/:id', upload.single('Imagen'), async (req, res) => {
    const { id } = req.params;
    const {
        Producto,
        Precio,
        Descripción,
        IVA,
        Familia,
        Subsección,
        Modelo,
        Marca,
        Categoria,
        activo,
        destacados
    } = req.body;

    try {
        // Obtén el producto actual de la base de datos
        const { data: currentProduct, error: fetchError } = await supabase
            .from('productos')
            .select('activo, destacados')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('Error al obtener el producto:', fetchError.message);
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }

        // Prepara los datos para la actualización solo con los campos existentes
        const updateData = {
            ...(Producto && { Producto }),
            ...(Precio && { Precio: parseFloat(Precio) }),
            ...(Descripción && { Descripción }),
            ...(IVA && { IVA: parseFloat(IVA) }),
            ...(Familia && { Familia }),
            ...(Subsección && { Subsección }),
            ...(Modelo && { Modelo }),
            ...(Marca && { Marca }),
            ...(Categoria && { Categoria }),
            ...(activo !== undefined && { activo: !currentProduct.activo }), // Cambia automáticamente
            ...(destacados !== undefined && { destacados: !currentProduct.destacados }) // Cambia automáticamente
        };

        // Verifica que los valores numéricos sean válidos
        if (updateData.Precio && isNaN(updateData.Precio)) delete updateData.Precio;
        if (updateData.IVA && isNaN(updateData.IVA)) delete updateData.IVA;

        // Si hay una nueva imagen, súbela a Supabase y agrégala a `updateData`
        if (req.file) {
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('fotosProductos')
                .upload(`productos/${fileName}`, req.file.buffer, {
                    contentType: req.file.mimetype,
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) {
                console.error('Error al subir la imagen:', uploadError.message);
                return res.status(500).json({ error: 'Error al subir la imagen al bucket.' });
            }

            // Obtén la URL pública de la imagen
            const { data: publicUrlData, error: publicUrlError } = supabase
                .storage
                .from('fotosProductos')
                .getPublicUrl(`productos/${fileName}`);

            if (publicUrlError) {
                console.error('Error al obtener la URL pública:', publicUrlError.message);
                return res.status(500).json({ error: 'Error al generar la URL pública de la imagen.' });
            }

            // Agrega la URL de la imagen al objeto de datos a actualizar
            updateData.Imagen = publicUrlData.publicUrl;
        }

        // Actualiza el producto en la base de datos
        const { data, error } = await supabase
            .from('productos')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('Error al actualizar la base de datos:', error.message);
            return res.status(500).json({ error: 'Error al actualizar el producto en la base de datos.' });
        }

        res.status(200).json({ message: 'Producto actualizado correctamente', data });
    } catch (error) {
        console.error('Error general:', error.message);
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




  app.patch('/categories/:id', upload.single('imagen'), async (req, res) => {
    const { id } = req.params;
    const {
        Nombre,
    } = req.body;

    try {
        // Prepara los datos para la actualización solo con los campos existentes
        const updateData = {
            ...(Nombre && { Nombre }),
        };

        // Si hay una nueva imagen, súbela a Supabase y agrégala a `updateData`
        if (req.file) {
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('categoriesFotos')
                .upload(`categorias/${fileName}`, req.file.buffer, {
                    contentType: req.file.mimetype,
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) {
                console.error('Error al subir la imagen:', uploadError.message);
                return res.status(500).json({ error: 'Error al subir la imagen al bucket.' });
            }

            // Obtén la URL pública de la imagen
            const { data: publicUrlData, error: publicUrlError } = supabase
                .storage
                .from('categoriesFotos')
                .getPublicUrl(`categorias/${fileName}`);

            if (publicUrlError) {
                console.error('Error al obtener la URL pública:', publicUrlError.message);
                return res.status(500).json({ error: 'Error al generar la URL pública de la imagen.' });
            }

            // Agrega la URL de la imagen al objeto de datos a actualizar
            updateData.imagen = publicUrlData.publicUrl;
        }

        // Actualiza el producto en la base de datos
        const { data, error } = await supabase
            .from('categorias')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('Error al actualizar la base de datos:', error.message);
            return res.status(500).json({ error: 'Error al actualizar el producto en la base de datos.' });
        }

        res.status(200).json({ message: 'Producto actualizado correctamente', data });
    } catch (error) {
        console.error('Error general:', error.message);
        res.status(500).json({ error: 'Error al actualizar el producto.' });
    }
});














// Puerto donde correrá el servidor
const PORT = process.env.PORT || 3000;


// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});