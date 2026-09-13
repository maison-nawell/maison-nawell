const form = document.getElementById("login-form"); const email = document.getElementById("email"); const password = document.getElementById("password"); const message = document.getElementById("message");
form.addEventListener("submit", async (event) => {
event.preventDefault();

message.textContent = "Connexion...";

try {

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email.value.trim(),
            password: password.value
        });

    if (error) {
        throw error;
    }

    if (!data.session) {
        throw new Error(
            "Connexion impossible."
        );
    }

    window.location.href = "admin.html";

} catch (error) {

    console.error("Erreur connexion :", error);

    message.textContent =
        error.message ||
        "Email ou mot de passe incorrect.";
}
});