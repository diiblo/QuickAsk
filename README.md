# QuickAsk - Assistant IA & Blocs de Texte

QuickAsk est une extension Chrome puissante qui transforme la manière dont vous interagissez avec les champs de texte sur le web. Elle combine l'intelligence artificielle (IA) pour générer du contenu et un système de blocs de texte (raccourcis) pour l'automatisation.

## 🚀 Fonctionnalités Principales

1.  **Assistant IA Universel** : Rédigez, corrigez ou traduisez du texte dans n'importe quel champ de saisie (Google, LinkedIn, Email, CMS, etc.) en utilisant vos propres clés API (Ollama, OpenAI, Gemini, Claude, etc.).
2.  **Système "Blocs" (Shortcuts)** : Créez des raccourcis pour insérer instantanément des textes pré-définis. Par exemple, tapez `[CV_CV1]` pour insérer votre CV version Canada.
3.  **Interface "Ruban" Moderne** : Un bouton discret qui se déploie au survol pour offrir des contrôles rapides sans encombrer l'écran.
4.  **Mode IA ON/OFF** : Désactivez l'IA pour n'utiliser que les blocs de texte (ultra-rapide, aucune requête réseau).
5.  **Configuration "In-Page"** : Modifiez vos fournisseurs et vos blocs directement depuis la page où vous êtes, sans ouvrir les machins complexes de Chrome.
6.  **Multi-support** : Fonctionne sur les `input`, `textarea`, et les éditeurs complexes comme ceux de LinkedIn ou Gmail.
7.  **100% Français** : L'interface est entièrement en français par défaut.

## 📥 Installation

### Depuis les sources (Développement)

1.  **Pré-requis** : Avoir [Node.js](https://nodejs.org/) installé.
2.  **Télécharger le code** : Clonez ce dépôt ou téléchargez les fichiers.
3.  **Installer les dépendances** :
    ```bash
    npm install
    ```
4.  **Construire l'extension** :
    ```bash
    npm run build
    ```
    Cela va créer un dossier `dist`.
5.  **Charger dans Chrome** :
    *   Ouvrez Chrome et allez sur `chrome://extensions`.
    *   Activez le **Mode développeur** (en haut à droite).
    *   Cliquez sur **Charger l'extension non empaquetée**.
    *   Sélectionnez le dossier `dist`.

## 📖 Utilisation

### 1. L'Interface Ruban
Sur n'importe quelle page web contenant un champ de texte :
*   Cliquez dans le champ pour le rendre actif.
*   Un petit bouton (✨) apparaît à proximité (souvent en haut à droite du champ).
*   **Survolez** ce bouton pour dérouler le ruban :
    *   ⚙️ **Paramètres** : Ouvre le panneau de configuration.
    *   🔌 **IA ON/IA OFF** : Active ou désactive l'appel à l'IA.

### 2. Le Système de Blocs (Shortcuts)
Les blocs vous permettent d'insérer du texte statique rapidement.
*   Format : `[CATEGORIE_SOUSCLE]`
*   **Exemples** :
    *   `[LM]` : Insère une Lettre de Motivation (si configuré).
    *   `[CV_France]` : Insère votre CV version France.
    *   `[CV_Canada]` : Insère votre CV version Canada.

**Comment les créer ?**
1.  Cliquez sur l'icône ⚙️ (Paramètres) dans le ruban.
2.  Allez dans l'onglet **Blocs de Prompts**.
3.  Cliquez sur **Ajouter un Bloc**.
4.  Remplissez :
    *   **Catégorie** : Le groupe principal (ex: `CV`).
    *   **Sous-clé** : La spécificité (ex: `France`). *Laisser vide si pas de sous-catégorie.*
    *   **Contenu** : Le texte à insérer.
5.  Sauvegardez.
6.  Dans un champ, tapez `[CV_France]` puis cliquez sur le bouton ✨. Le texte se remplace instantanément.

### 3. L'Intelligence Artificielle (IA)
Si le mode IA est sur **ON** :
1.  Tapez une consigne dans le champ (ex: "Rédige un email de remerciement pour un entretien").
2.  Cliquez sur le bouton ✨.
3.  L'extension envoie votre texte à l'IA configurée (ex: Gemini, Ollama) et remplace votre consigne par la réponse.

## ⚙️ Configuration des Fournisseurs IA

Dans le panneau de paramètres (⚙️), onglet **Fournisseurs IA** :
*   **Ollama (Local)** : Idéal pour la confidentialité. Assurez-vous de lancer Ollama avec `OLLAMA_ORIGINS="*" ollama serve` pour autoriser l'extension à lui parler.
*   **Gemini / OpenAI / Claude** : Entrez simplement votre clé API.
*   **Activer/Désactiver** : Cochez la case à droite d'un fournisseur pour l'activer. Le premier fournisseur activé sera utilisé.

## 👨‍💻 Structure du Code (Pour les curieux)

Le code est commenté en français simple. Voici les fichiers clés :

*   `src/content/ContentApp.tsx` : C'est le cœur de l'interface qui s'affiche sur les pages web (le bouton, le ruban).
*   `src/content/SettingsPanel.tsx` : Le code du panneau de configuration qui s'ouvre par-dessus la page.
*   `src/content/InputManager.ts` : Une classe intelligente qui sait comment lire et écrire du texte dans les champs complexes (comme LinkedIn qui n'utilise pas de simples `texarea`).
*   `src/background/index.ts` : Le chef d'orchestre invisible qui fait les appels vers l'extérieur (les API IA) pour contourner les restrictions de sécurité des navigateurs.
*   `src/utils/ai-api.ts` : La bibliothèque qui sait parler aux différentes IA (Gemini, ChatGPT, etc.).

---
**Auteur** : King Rahman
