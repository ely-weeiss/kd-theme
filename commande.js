// --- CONFIGURATION ---
// Ton lien Google Apps Script officiel
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzDx5Ml211tDqNik6CsMQYutEJf_ORnIMKPQ5ZwzS_f5L-i51VUjpIXGJJZ8KPWPjva/exec'; 
// Ton numéro WhatsApp
const WA_NUMBER = '22227288065'; 

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', function(e) {
        // C'est ici que ça change : on écoute le bouton de la page checkout !
        if (e.target && e.target.id === 'submit-final-order' || e.target.closest('#submit-final-order')) {
            e.preventDefault();
            
            // 1. جلب معلومات العميل من الخانات (Récupérer les infos du client)
            let nom = document.getElementById('client-name').value.trim();
            let phone = document.getElementById('client-phone').value.trim();
            let address = document.getElementById('client-address').value.trim();

            // 2. التحقق من أن العميل أدخل معلوماته (Validation)
            if (!nom || !phone || !address) {
                alert("الرجاء إدخال جميع معلومات التوصيل (الاسم، الرقم، العنوان) قبل إرسال الطلب.");
                return; // Stoppe l'envoi si c'est vide
            }

            // 3. جلب بيانات السلة (Récupérer le panier)
            let cart = JSON.parse(localStorage.getItem('shop_cart_data')) || [];
            if(cart.length === 0) return;

            // 4. تجهيز نص الطلب للواتساب وللشيت (Préparer le texte)
            let orderDetails = "";
            let total = 0;
            let waMsg = `مرحباً، أريد طلب طلبية جديدة:%0A%0A*معلومات العميل:*%0A👤 الاسم: ${nom}%0A📱 الهاتف: ${phone}%0A📍 العنوان: ${address}%0A%0A*المنتجات المطلوبة:*%0A`;

            cart.forEach(item => {
                let sub = (item.price || 0) * (item.quantity || 1);
                total += sub;
                let line = `- ${item.quantity}x ${item.title} (${sub > 0 ? sub + ' اوقية' : 'السعر غير متوفر'})`;
                orderDetails += line + "\n";
                waMsg += line + "%0A";
            });

            waMsg += `%0A*المجموع الكلي: ${total} اوقية*%0A%0Aالرجاء تأكيد الطلب.`;

            // 5. تجهيز البيانات للإرسال إلى Google Sheets (Payload)
            let payload = {
                nom: nom,
                numero: phone,
                adresse: address,
                orderDetails: orderDetails,
                total: total
            };

            // 6. تغيير شكل الزر أثناء التحميل (Bouton de chargement)
            const btn = document.getElementById('submit-final-order');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الطلب...';
            btn.disabled = true;

            // 7. إرسال البيانات (Envoi vers ton Google Script)
            fetch(SCRIPT_URL, {
                method: 'POST',
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify(payload)
            })
            .then(response => {
                // فتح الواتساب (Ouverture WhatsApp)
                window.open(`https://wa.me/${WA_NUMBER}?text=${waMsg}`, '_blank');
                
                // تفريغ السلة بعد الطلب وتوجيه المستخدم للرئيسية
                localStorage.removeItem('shop_cart_data'); 
                window.location.href = "/"; // Redirige vers l'accueil au lieu de recharger la page
            })
            .catch(error => {
                console.error('Erreur :', error);
                // فتح الواتساب حتى لو فشل الاتصال بجوجل شيت لضمان عدم ضياع العميل
                window.open(`https://wa.me/${WA_NUMBER}?text=${waMsg}`, '_blank');
            })
            .finally(() => {
                if(btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            });
        }
    });
});
