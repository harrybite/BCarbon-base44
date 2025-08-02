# Project Details

This project is designed to provide a detailed view of various projects, including their metadata, status, and user interactions. The main component, `ProjectDetails.jsx`, serves as the entry point for displaying project information and managing user actions.

## Project Structure

The project is organized into the following components:

- **ProjectDetails.jsx**: The main component for the Project Details page, which imports and utilizes various subcomponents.
  
- **components/**: Contains modular components that encapsulate specific functionalities:
  - **ProjectHeader.jsx**: Displays the project header with relevant badges and buttons.
  - **ProjectOverview.jsx**: Presents an overview of the project's statistics.
  - **ProjectInfo.jsx**: Contains detailed information about the project.
  - **RoleActions.jsx**: Manages role-based actions for users.
  - **MintCreditsCard.jsx**: Handles the minting credits functionality.
  - **RetireCreditsCard.jsx**: Manages the retiring credits functionality.
  - **HoldersModal.jsx**: Displays a modal with a list of project holders.
  - **ApproveModal.jsx**: Presents a modal for approving credit amounts.
  - **CommentsSection.jsx**: Manages the comments functionality for user interactions.
  - **HolderTable.jsx**: Renders a table of project holders.

## Setup Instructions

1. **Clone the Repository**: 
   ```bash
   git clone <repository-url>
   cd ProjectDetails
   ```

2. **Install Dependencies**: 
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```

3. **Run the Application**: 
   Start the development server:
   ```bash
   npm start
   ```

4. **Access the Application**: 
   Open your browser and navigate to `http://localhost:3000` to view the Project Details page.

## Usage Guidelines

- Navigate through the project details using the provided buttons and links.
- Users can mint or retire credits based on their roles.
- Comments can be added to each project, and existing comments will be displayed in the comments section.
- The holders modal provides a comprehensive view of all project holders, with options to filter and paginate through the list.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.