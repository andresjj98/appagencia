const { supabaseAdmin } = require('../supabase');

const uploadReceipt = async (req, res) => {
  const { installment_id } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  try {
    const filePath = `receipts/${installment_id}/${Date.now()}-${file.originalname}`;
    
    const { error: uploadError } = await supabaseAdmin.storage.from('receipts').upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadError) {
      console.error('Error uploading receipt to Supabase Storage:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data: urlData } = supabaseAdmin.storage.from('receipts').getPublicUrl(filePath);
    
    const { data, error: updateError } = await supabaseAdmin
      .from('reservation_installments')
      .update({ receipt_url: urlData.publicUrl })
      .eq('id', installment_id)
      .select();

    if (updateError) {
      console.error('Error updating installment with receipt URL:', updateError);
      throw new Error('Failed to update installment with receipt URL.');
    }

    res.status(200).json({ message: 'Receipt uploaded successfully.', data });

  } catch (error) {
    console.error('Server error in receipt upload:', error);
    res.status(500).json({ message: 'Server error.', details: error.message });
  }
};

const updateInstallmentStatus = async (req, res) => {
    const { installment_id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is required.' });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('reservation_installments')
            .update({ status: status })
            .eq('id', installment_id)
            .select();

        if (error) {
            throw error;
        }

        res.status(200).json({ message: 'Installment status updated successfully.', data });
    } catch (error) {
        console.error('Error updating installment status:', error);
        res.status(500).json({ message: 'Server error.', details: error.message });
    }
};

module.exports = {
  uploadReceipt,
  updateInstallmentStatus,
};