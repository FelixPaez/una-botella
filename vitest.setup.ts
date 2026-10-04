// Los tests corren en hora de Tokio a propósito: el plan, el cielo y la luna deben
// calcularse con la hora de Santa Clara sea cual sea la zona del dispositivo.
process.env.TZ = 'Asia/Tokyo';
