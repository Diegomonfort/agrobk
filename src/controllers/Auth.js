const supabase = require("../config/supabase");

const bcrypt = require('bcrypt'); // Asegúrate de instalarlo: npm install bcrypt
const jwt = require('jsonwebtoken');


const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validación básica
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña requeridos.' });
    }

    // Buscar el usuario en tu tabla 'users'
    const { data: users, error } = await supabase
      .from('user')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (error || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    const user = users[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.pass); // 'pass' debe ser el campo en la tabla
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email }, // payload
      'asoiy2398chweiouch9po23hf', // clave secreta
      { expiresIn: '1h' } // expira en 1 hora
    );

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      token, // aquí va el JWT
      user: {
        id: user.id,
        email: user.email,
      }
    });

  } catch (error) {
    console.error("Error en loginAdmin:", error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};


module.exports = {loginAdmin};