const { loadPrivateKeyFromPfx } = require("../../utils/plexo.utils");
const moment = require("moment");
const { createSign } = require("crypto");
const axios = require("axios");
const supabase = require("../config/supabase");

const canonicalize = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(canonicalize);
  const sortedObj = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sortedObj[key] = canonicalize(obj[key]);
    });
  return sortedObj;
};

const RecibeInfoExpressCheckout = async (req, res) => {
  try {
    const { datosPersonales, direccionEnvio, products } = req.body;
    if (!datosPersonales || !direccionEnvio || !products || !Array.isArray(products)) {
      return res.status(400).json({ error: "Faltan datos requeridos o la estructura de datos es incorrecta." });
    }

    console.log("Datos personales:", datosPersonales);
    console.log("Dirección de envío:", direccionEnvio);
    console.log("Productos recibidos:", products);

    // Consultar los productos en Supabase
    const { data: productos, error } = await supabase
      .from("productos")
      .select("id, Precio, Descripción, Producto")
      .in("id", products);

    if (error) {
      console.error("❌ Error al consultar productos en Supabase:", error);
      return res.status(500).json({ error: "Error al obtener información de los productos." });
    }

    if (!productos.length) {
      return res.status(400).json({ error: "Los productos seleccionados no existen." });
    }

    // Construcción de los items con la información de Supabase
    const itemsArray = productos.map((producto, index) => ({
      Amount: parseFloat(producto.Precio.toFixed(2)),
      ClientItemReferenceId: `Item-${producto.id}`,
      Name: `${producto.Producto}`,
      Quantity: 1, // Cantidad fija por ahora
    }));

    console.log(itemsArray)

    const privateKey = loadPrivateKeyFromPfx();

    const innerObject = {
      Client: "AgrojardinTest",
      Request: {
        AuthorizationData: {
          Action: 64,
          ClientInformation: {
            Name: direccionEnvio.nombre,
            LastName: direccionEnvio.apellido,
            Address: direccionEnvio.direccion,
            Email: datosPersonales.email,
          },
          DoNotUseCallback: true,
          LimitBanks: ["113", "137"],
          LimitIssuers: ["4", "11"],
          MetaReference: datosPersonales.email,
          OptionalCommerceId: 12285,
          RedirectUri: "http://localhost/miURL",
          Type: 0,
        },
        PaymentData: {
          ClientReferenceId: Date.now().toString(),
          CurrencyId: 2,
          FinancialInclusion: {
            BilledAmount: parseFloat(itemsArray.reduce((acc, item) => acc + item.Amount, 0).toFixed(2)),
            InvoiceNumber: -1390098693,
            TaxedAmount: parseFloat(itemsArray.reduce((acc, item) => acc + item.Amount * 0.9, 0).toFixed(1)), // Asumiendo 10% de impuestos
            Type: 1,
          },
          Installments: 1,
          Items: itemsArray, // Se agregan los productos obtenidos de Supabase
          OptionalCommerceId: 12285,
          PaymentInstrumentInput: {
            NonStorableItems: {
              CVC: "123",
            },
            OptionalInstrumentFields: {
              ShippingAddress: direccionEnvio.direccion,
              ShippingZipCode: direccionEnvio.codigoPostal,
              ShippingCity: direccionEnvio.ciudad,
              ShippingCountry: "UY",
              ShippingFirstName: direccionEnvio.nombre,
              ShippingLastName: direccionEnvio.apellido,
              ShippingPhoneNumber: datosPersonales.telefono,
            },
            UseExtendedClientCreditIfAvailable: false,
          },
        },
      },
    };

    const fingerprint = "579F4609DD4315D890921F47293B0E7CAC6CB290";
    const expirationTime = moment().add(1, "hour").valueOf();

    const payloadToSign = {
      Fingerprint: fingerprint,
      Object: canonicalize(innerObject),
      UTCUnixTimeExpiration: expirationTime,
    };

    let jsonString = JSON.stringify(payloadToSign, null, 0).replace(/\s+/g, "");

    jsonString = jsonString
      .replace(/"BilledAmount":(\d+)(,|})/g, '"BilledAmount":$1.0$2')
      .replace(/"TaxedAmount":(\d+)(,|})/g, '"TaxedAmount":$1.0$2')
      .replace(/"Amount":(\d+)(,|})/g, '"Amount":$1.0$2');

    const sign = createSign("SHA512");
    sign.update(jsonString);
    const signature = sign.sign(
      {
        key: privateKey,
        padding: require("crypto").constants.RSA_PKCS1_PADDING,
      },
      "base64"
    );

    const finalPayloadJson = `{"Object":${jsonString},"Signature":"${signature}"}`;

    const response = await axios.post(
      "https://testing.plexo.com.uy:4043/SecurePaymentGateway.svc/ExpressCheckout",
      finalPayloadJson,
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("✅ Respuesta de pasarela:", JSON.stringify(response.data, null, 2));
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("❌ Error en el proceso de pago:", error.response?.data || error.message);
    return res.status(500).json({ error: "Error en el procesamiento del pago." });
  }
};

module.exports = RecibeInfoExpressCheckout;
