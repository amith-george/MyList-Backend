exports.getStatus = async (req, res) => {
    try {
        res.status(200).json({ message: 'Backend is active', status: 'ok' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
