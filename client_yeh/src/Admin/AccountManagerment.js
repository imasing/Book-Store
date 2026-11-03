import { Button, Col, Container, Form, Row, Table } from "react-bootstrap";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AccountManager() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  useEffect(() => {
    axios.get("http://localhost:9999/users").then((result) => setUsers(result.data));
    axios.get("http://localhost:9999/roles").then((result) => setRoles(result.data));
    axios.get("http://localhost:9999/tables").then((result) => setTables(result.data));
  }, []);

  const cleanUser = (u) => ({
    ...u,
    roleId: Number(u.roleId),
    tableId: u.roleId === 1 ? Number(u.tableId) : undefined,
    ...(u.id ? { id: Number(u.id) } : {})
  });

  const handleSubmit = () => {
    const cleaned = cleanUser(selectedUser);

    if (isAdding) {
      const { id, ...payload } = cleaned;
      axios.post("http://localhost:9999/users", payload).then((res) => {
        setUsers([...users, res.data]);
        window.dispatchEvent(new Event("user-updated"));
        alert("Đã thêm tài khoản!");
        setSelectedUser(null);
        setIsAdding(false);
      });
    } else {
      axios
        .put(`http://localhost:9999/users/${cleaned.id}`, cleaned)
        .then((res) => {
          const updated = users.map((u) => (u.id === res.data.id ? res.data : u));
          setUsers(updated);
          alert("Đã cập nhật tài khoản!");
        });
    }
  };

  const handleDelete = () => {
    if (!selectedUser?.id) return alert("Not Found!");
    if (!window.confirm(`Xoá tài khoản "${selectedUser.username}"?`)) return;

    axios.delete(`http://localhost:9999/users/${selectedUser.id}`).then(() => {
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setSelectedUser(null);
      setIsAdding(false);
      alert("Đã xoá tài khoản!");
    });
  };

  const usedTableIds = users
      .filter(u => u.roleId === 1 && u.tableId !== undefined)
      .map(u => Number(u.tableId));

  const availableTables = tables.filter(t => !usedTableIds.includes(Number(t.id)));

  return (
    <>
      <style>
        {`
          .sticky-details {
            position: sticky;
            top: 20px;
            align-self: flex-start;
            max-height: 90vh;
            overflow-y: auto;
            padding-right: 12px;
          }
        `}
      </style>

      <Container>
        <h3 className="my-3">Account Manager</h3>
        <Button
              className="mb-3"
              onClick={() => {
                setSelectedUser({
                  username: "",
                  password: "",
                  roleId: roles[0]?.id || 1,
                  tableId: roles[0]?.id == 1 ? availableTables[0]?.id : undefined
                });
                setIsAdding(true);
              }}
            >
              Add Account
        </Button>
        <Row>
          <Col xs={6}>
            <Form className="mb-3">
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Search username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Form.Group>
            </Form>

            <Table bordered hover striped>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Table</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((u) =>
                    u.username.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((u) => (
                    <tr
                      key={u.id}
                      style={{
                        backgroundColor:
                          selectedUser?.id === u.id ? "#f0f8ff" : "transparent",
                        fontWeight:
                          selectedUser?.id === u.id ? "bold" : "normal",
                        cursor: "pointer"
                      }}
                    >
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>
                        {roles.find((r) => r.id == u.roleId)?.name || "Unknown"}
                      </td>
                      <td>
                        {u.roleId === 1
                          ? tables.find((t) => t.id == u.tableId)?.name || "-"
                          : "-"}
                      </td>
                      <td>
                        <Button
                          className="btn btn-secondary"
                          onClick={() => {
                            setSelectedUser(u);
                            setIsAdding(false);
                          }}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </Col>

          <Col xs={6} className="sticky-details">
            <h6>Account Details</h6>
            {selectedUser ? (
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    value={selectedUser.username}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, username: e.target.value })
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      value={selectedUser.password}
                      onChange={(e) =>
                        setSelectedUser({ ...selectedUser, password: e.target.value })
                      }
                    />
                    <Button
                      variant="outline-dark"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ marginLeft: "8px" }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </Button>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={selectedUser.roleId}
                    onChange={(e) => {
                      const roleId = Number(e.target.value);
                      setSelectedUser((prev) => ({
                        ...prev,
                        roleId,
                        tableId: roleId == 1 ? availableTables[0]?.id : undefined
                      }));
                    }}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {selectedUser.roleId === 1 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Table</Form.Label>

                    {isAdding ? (
                      availableTables.length === 0 ? (
                        <p className="text-danger">Tất cả các bàn đã có tài khoản.</p>
                      ) : (
                        <Form.Select
                          value={selectedUser.tableId || ""}
                          onChange={(e) =>
                            setSelectedUser({
                              ...selectedUser,
                              tableId: Number(e.target.value),
                            })
                          }
                        >
                          {availableTables.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </Form.Select>
                      )
                    ) : (
                      // <Form.Select
                      //   value={selectedUser.tableId || ""}
                      //   onChange={(e) =>
                      //     setSelectedUser({
                      //       ...selectedUser,
                      //       tableId: Number(e.target.value),
                      //     })
                      //   }
                      // >
                      //   {tables.map((t) => (
                      //     <option key={t.id} value={t.id}>
                      //       {t.name}
                      //     </option>
                      //   ))}
                      // </Form.Select>
                      <Form.Control
                        value={
                          tables?.find((t) => t.id == selectedUser.tableId)?.name || "-"
                        }
                        readOnly
                        style={{ backgroundColor: "#e9ecef" }}
                      />
                    )}
                  </Form.Group>
                )}

                <Button type="submit" className="btn btn-primary">
                  {isAdding ? "Add" : "Save Changes"}
                </Button>
                <Button
                  variant="danger"
                  className="ms-2"
                  onClick={handleDelete}
                >
                  Delete Account
                </Button>
              </Form>
            ) : (
              <p>Please select an account.</p>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}
