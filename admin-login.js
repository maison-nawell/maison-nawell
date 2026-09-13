const loginForm = document.getElementById("login-form"); const resetButton = document.getElementById("reset-button");
const newPasswordForm = document.getElementById("new-password-form");
const emailInput = document.getElementById("email"); const passwordInput = document.getElementById("password");
const newPasswordInput = document.getElementById("new-password"); const confirmPasswordInput = document.getElementById("confirm-password");
const loginSection = document.getElementById("login-section"); const newPasswordSection = document.getElementById("new-password-section");
const message = document.getElementById("message");
// -------------------------------------------------- // CONNEXION // --------------------------------------------------
loginForm.addEventListener("submit", async (event) => {
event.preventDefault();

message.className = "";
message.textContent = "Connexion...";

const email = emailInput.value.trim();
const password = passwordInput.value;

try {

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {
        throw error;
    }

    if (!data.session) {
        throw new Error("Connexion impossible.");
    }

    message.className = "success";
    message.textContent = "Connexion réussie...";

    window.location.href = "admin.html";

} catch (error) {

    console.error("Erreur connexion :", error);

    message.className = "error";

    message.textContent =
        "Email ou mot de passe incorrect.";
}
});
// -------------------------------------------------- // MOT DE PASSE OUBLIÉ // --------------------------------------------------
resetButton.addEventListener("click", async () => {
const email = emailInput.value.trim();

if (!email) {

    message.className = "error";
    message.textContent =
        "Entre ton adresse email.";

    return;
}

message.className = "";
message.textContent =
    "Envoi du lien de récupération...";

try {

    /*
     * Cette URL est automatiquement adaptée
     * à ton site GitHub Pages.
     */
    const redirectTo =
        new URL("admin-login.html", window.location.href).href;

    const { error } =
        await supabaseClient.auth.resetPasswordForEmail(
            email,
            {
                redirectTo: redirectTo
            }
        );

    if (error) {
        throw error;
    }

    message.className = "success";

    message.textContent =
        "Un email de récupération a été envoyé. Vérifie ta boîte mail et tes spams.";

} catch (error) {

    console.error("Erreur récupération :", error);

    message.className = "error";

    message.textContent =
        error.message ||
        "Impossible d'envoyer le lien de récupération.";
}
});
// -------------------------------------------------- // RETOUR APRÈS CLIC SUR LE LIEN DE RÉCUPÉRATION // --------------------------------------------------
supabaseClient.auth.onAuthStateChange((event) => {
console.log("Événement Auth :", event);

if (event === "PASSWORD_RECOVERY") {

    loginSection.classList.add("hidden");

    newPasswordSection.classList.remove("hidden");

    message.className = "success";

    message.textContent =
        "Choisis maintenant ton nouveau mot de passe.";
}
});
// -------------------------------------------------- // ENREGISTRER LE NOUVEAU MOT DE PASSE // --------------------------------------------------
newPasswordForm.addEventListener("submit", async (event) => {
event.preventDefault();

const newPassword = newPasswordInput.value;
const confirmPassword = confirmPasswordInput.value;

if (newPassword.length < 8) {

    message.className = "error";

    message.textContent =
        "Le mot de passe doit contenir au moins 8 caractères.";

    return;
}

if (newPassword !== confirmPassword) {

    message.className = "error";

    message.textContent =
        "Les deux mots de passe ne correspondent pas.";

    return;
}

message.className = "";

message.textContent =
    "Enregistrement du nouveau mot de passe...";

try {

    const { error } =
await supabaseClient.auth.updateUser({
            password: newPassword
        });

    if (error) {
        throw error;
    }

    message.className = "success";

    message.textContent =
        "Mot de passe modifié ! Connexion...";

    setTimeout(() => {

        window.location.href = "admin.html";

    }, 1500);

} catch (error) {

    console.error(
        "Erreur changement mot de passe :",
        error
    );

    message.className = "error";

    message.textContent =
        error.message ||
        "Impossible de modifier le mot de passe.";
}
});
